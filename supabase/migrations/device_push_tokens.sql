-- ==============================================================================
-- EduFlow: Device Push Tokens Table for Parent & Student Notifications
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.device_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'student', 'teacher')),
    push_token TEXT NOT NULL,
    device_platform VARCHAR(20) CHECK (device_platform IN ('android', 'ios', 'web')),
    device_model TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_device_push_tokens UNIQUE (student_id, push_token)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_student ON public.device_push_tokens(student_id);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_batch ON public.device_push_tokens(batch_id);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_token ON public.device_push_tokens(push_token);

-- Enable Row Level Security (RLS)
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow reading push tokens (for teachers dispatching alerts)
CREATE POLICY "Allow authenticated read device_push_tokens"
ON public.device_push_tokens
FOR SELECT
USING (true);

-- Allow students / parents to register their device tokens
CREATE POLICY "Allow public insert and update device_push_tokens"
ON public.device_push_tokens
FOR ALL
USING (true)
WITH CHECK (true);
