-- ==============================================================================
-- EduFlow Subscription and Manual UPI Payment System Migration
-- ==============================================================================

-- 1. Create teacher_subscriptions table
CREATE TABLE IF NOT EXISTS public.teacher_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('trial', 'monthly', 'yearly')),
    status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'expired', 'pending', 'cancelled')),
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    has_used_trial BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_teacher_subscriptions_teacher_id UNIQUE (teacher_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_subscriptions_teacher_id ON public.teacher_subscriptions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subscriptions_status ON public.teacher_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_teacher_subscriptions_period_end ON public.teacher_subscriptions(current_period_end);

-- 2. Create payment_requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
    amount_paise INTEGER NOT NULL CHECK (amount_paise IN (49900, 499900)),
    payment_reference TEXT NOT NULL UNIQUE,
    transaction_reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- Indexes for payment requests
CREATE INDEX IF NOT EXISTS idx_payment_requests_teacher_id ON public.payment_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON public.payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_transaction_ref ON public.payment_requests(transaction_reference);

-- 3. Row Level Security (RLS)
ALTER TABLE public.teacher_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Helper function: check if an authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Helper function: check if an authenticated user is a teacher
CREATE OR REPLACE FUNCTION public.is_teacher(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'teacher'
  );
$$;

-- RLS Policies for teacher_subscriptions:
-- Teachers can view their own subscription; Admins can view any subscription.
DROP POLICY IF EXISTS "Teachers and admins can view subscriptions" ON public.teacher_subscriptions;
CREATE POLICY "Teachers and admins can view subscriptions"
    ON public.teacher_subscriptions
    FOR SELECT
    USING (
      auth.uid() = teacher_id OR public.is_admin(auth.uid())
    );

-- Only trusted backend functions / admins can insert or update teacher_subscriptions.
-- Direct client inserts/updates are restricted to prevent client tampering.
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.teacher_subscriptions;
CREATE POLICY "Admins can update subscriptions"
    ON public.teacher_subscriptions
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for payment_requests:
-- Teachers can view their own payment requests; Admins can view all.
DROP POLICY IF EXISTS "Teachers and admins can view payment requests" ON public.payment_requests;
CREATE POLICY "Teachers and admins can view payment requests"
    ON public.payment_requests
    FOR SELECT
    USING (
      auth.uid() = teacher_id OR public.is_admin(auth.uid())
    );

-- Teachers can insert their own payment requests
DROP POLICY IF EXISTS "Teachers can create payment requests" ON public.payment_requests;
CREATE POLICY "Teachers can create payment requests"
    ON public.payment_requests
    FOR INSERT
    WITH CHECK (
      auth.uid() = teacher_id AND public.is_teacher(auth.uid())
    );

-- Only admins can update payment requests (approve/reject)
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
CREATE POLICY "Admins can update payment requests"
    ON public.payment_requests
    FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- No user can delete payment requests (strict audit preservation)
DROP POLICY IF EXISTS "No one can delete payment requests" ON public.payment_requests;
CREATE POLICY "No one can delete payment requests"
    ON public.payment_requests
    FOR DELETE
    USING (false);


-- 4. Server-Side Trusted Operations (SECURITY DEFINER RPCs)

-- A. Start 30-Day Free Trial
CREATE OR REPLACE FUNCTION public.start_teacher_trial()
RETURNS public.teacher_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_teacher BOOLEAN;
  v_existing public.teacher_subscriptions%ROWTYPE;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_trial_end TIMESTAMPTZ := timezone('utc'::text, now()) + INTERVAL '30 days';
  v_result public.teacher_subscriptions%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure caller is a teacher
  SELECT (role = 'teacher') INTO v_is_teacher
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_is_teacher IS NOT TRUE THEN
    RAISE EXCEPTION 'Only teachers are eligible to start a trial';
  END IF;

  -- Check existing subscription record
  SELECT * INTO v_existing
  FROM public.teacher_subscriptions
  WHERE teacher_id = v_user_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.has_used_trial = true OR v_existing.trial_start IS NOT NULL THEN
      RAISE EXCEPTION 'Trial has already been used for this account';
    END IF;

    -- Update existing record
    UPDATE public.teacher_subscriptions
    SET plan = 'trial',
        status = 'trialing',
        trial_start = v_now,
        trial_end = v_trial_end,
        current_period_start = v_now,
        current_period_end = v_trial_end,
        has_used_trial = true,
        updated_at = v_now
    WHERE teacher_id = v_user_id
    RETURNING * INTO v_result;
  ELSE
    -- Insert new subscription
    INSERT INTO public.teacher_subscriptions (
      teacher_id,
      plan,
      status,
      trial_start,
      trial_end,
      current_period_start,
      current_period_end,
      has_used_trial,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'trial',
      'trialing',
      v_now,
      v_trial_end,
      v_now,
      v_trial_end,
      true,
      v_now,
      v_now
    )
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;


-- B. Submit Payment Request (Atomic & Validated)
CREATE OR REPLACE FUNCTION public.submit_payment_request(
  p_plan TEXT,
  p_transaction_reference TEXT
)
RETURNS public.payment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_teacher BOOLEAN;
  v_clean_ref TEXT;
  v_payment_ref TEXT;
  v_amount_paise INTEGER;
  v_result public.payment_requests%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT (role = 'teacher') INTO v_is_teacher
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_is_teacher IS NOT TRUE THEN
    RAISE EXCEPTION 'Only teachers can purchase a subscription';
  END IF;

  -- Validate plan and exact price in paise
  IF p_plan = 'monthly' THEN
    v_amount_paise := 49900; -- ₹499
  ELSIF p_plan = 'yearly' THEN
    v_amount_paise := 499900; -- ₹4,999
  ELSE
    RAISE EXCEPTION 'Invalid plan selected: %', p_plan;
  END IF;

  -- Clean transaction reference
  v_clean_ref := UPPER(TRIM(p_transaction_reference));
  IF v_clean_ref IS NULL OR LENGTH(v_clean_ref) < 6 THEN
    RAISE EXCEPTION 'Please provide a valid transaction reference (minimum 6 characters)';
  END IF;

  -- Check if transaction reference is already submitted
  IF EXISTS (
    SELECT 1 FROM public.payment_requests
    WHERE transaction_reference = v_clean_ref
  ) THEN
    RAISE EXCEPTION 'This transaction reference has already been submitted';
  END IF;

  -- Generate unique payment reference
  v_payment_ref := 'PAY-' || TO_CHAR(timezone('utc'::text, now()), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6));

  INSERT INTO public.payment_requests (
    teacher_id,
    plan,
    amount_paise,
    payment_reference,
    transaction_reference,
    status,
    created_at
  ) VALUES (
    v_user_id,
    p_plan,
    v_amount_paise,
    v_payment_ref,
    v_clean_ref,
    'pending',
    timezone('utc'::text, now())
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;


-- C. Admin Review Payment Request (Atomic, Idempotent, Server-Calculated Expiry)
CREATE OR REPLACE FUNCTION public.review_payment_request(
  p_request_id UUID,
  p_action TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS public.payment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_req public.payment_requests%ROWTYPE;
  v_sub public.teacher_subscriptions%ROWTYPE;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_duration INTERVAL;
  v_result public.payment_requests%ROWTYPE;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: only administrators can review payments';
  END IF;

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid review action: must be approve or reject';
  END IF;

  -- Select request with row lock
  SELECT * INTO v_req
  FROM public.payment_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found: %', p_request_id;
  END IF;

  IF v_req.status != 'pending' THEN
    RAISE EXCEPTION 'Payment request has already been reviewed (current status: %)', v_req.status;
  END IF;

  IF p_action = 'reject' THEN
    UPDATE public.payment_requests
    SET status = 'rejected',
        reviewed_by = v_admin_id,
        reviewed_at = v_now,
        rejection_reason = COALESCE(p_rejection_reason, 'Payment verification failed')
    WHERE id = p_request_id
    RETURNING * INTO v_result;

    RETURN v_result;
  END IF;

  -- For approval: calculate duration
  IF v_req.plan = 'yearly' THEN
    v_duration := INTERVAL '365 days';
  ELSE
    v_duration := INTERVAL '30 days';
  END IF;

  -- Lock and read subscription
  SELECT * INTO v_sub
  FROM public.teacher_subscriptions
  WHERE teacher_id = v_req.teacher_id
  FOR UPDATE;

  IF FOUND THEN
    -- If subscription is currently active (and paid), extend from current_period_end
    IF v_sub.status = 'active' AND v_sub.current_period_end > v_now THEN
      v_period_start := v_sub.current_period_start;
      v_period_end := v_sub.current_period_end + v_duration;
    ELSE
      -- Expired or previously trialing: starts immediately at verification time
      v_period_start := v_now;
      v_period_end := v_now + v_duration;
    END IF;

    UPDATE public.teacher_subscriptions
    SET plan = v_req.plan,
        status = 'active',
        current_period_start = v_period_start,
        current_period_end = v_period_end,
        updated_at = v_now
    WHERE teacher_id = v_req.teacher_id;
  ELSE
    -- Insert new active subscription
    v_period_start := v_now;
    v_period_end := v_now + v_duration;

    INSERT INTO public.teacher_subscriptions (
      teacher_id,
      plan,
      status,
      current_period_start,
      current_period_end,
      created_at,
      updated_at
    ) VALUES (
      v_req.teacher_id,
      v_req.plan,
      'active',
      v_period_start,
      v_period_end,
      v_now,
      v_now
    );
  END IF;

  -- Update payment request to approved
  UPDATE public.payment_requests
  SET status = 'approved',
      reviewed_by = v_admin_id,
      reviewed_at = v_now
  WHERE id = p_request_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
