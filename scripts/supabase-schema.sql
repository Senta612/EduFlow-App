-- ==============================================================================
-- EduFlow: Tuition Management Database Schema for Supabase (Idempotent / Safe Re-run)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Teacher / Institute identity)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'teacher',
  phone text,
  institute_name text,
  specialization text,
  qualifications text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Batches Table
create table if not exists public.batches (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references public.profiles(id) on delete set null,
  name text not null,
  grade text not null,
  subject text not null,
  schedule text not null,
  timing text not null,
  room text,
  student_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Students Table
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references public.batches(id) on delete cascade not null,
  name text not null,
  roll_number text not null,
  email text,
  parent_phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Attendance Records Table
create table if not exists public.attendance_records (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references public.batches(id) on delete cascade not null,
  date date not null,
  present_count integer default 0,
  absent_count integer default 0,
  total_students integer default 0,
  submitted_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint unique_batch_attendance_date unique (batch_id, date)
);

-- 5. Attendance Items (per student attendance status)
create table if not exists public.attendance_items (
  id uuid primary key default uuid_generate_v4(),
  attendance_record_id uuid references public.attendance_records(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  status text not null check (status in ('present', 'absent')),
  created_at timestamptz default now(),
  constraint unique_student_attendance_record unique (attendance_record_id, student_id)
);

-- 6. Homework Assignments Table
create table if not exists public.homework_assignments (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references public.batches(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Homework Submissions Table
create table if not exists public.homework_submissions (
  id uuid primary key default uuid_generate_v4(),
  homework_id uuid references public.homework_assignments(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  status text not null check (status in ('done', 'half_done', 'not_done')),
  remarks text,
  created_at timestamptz default now(),
  constraint unique_homework_student_submission unique (homework_id, student_id)
);

-- 8. Tests Table
create table if not exists public.tests (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references public.batches(id) on delete cascade not null,
  title text not null,
  date date not null,
  max_marks numeric not null default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Test Marks Table
create table if not exists public.test_marks (
  id uuid primary key default uuid_generate_v4(),
  test_id uuid references public.tests(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  marks_obtained numeric,
  created_at timestamptz default now(),
  constraint unique_test_student_mark unique (test_id, student_id)
);

-- ==============================================================================
-- Row-Level Security (RLS) Policies (Safe Re-run)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.batches enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_items enable row level security;
alter table public.homework_assignments enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.tests enable row level security;
alter table public.test_marks enable row level security;

-- Drop existing policies if they already exist so the script never fails on re-runs
drop policy if exists "Allow all on profiles" on public.profiles;
drop policy if exists "Allow all on batches" on public.batches;
drop policy if exists "Allow all on students" on public.students;
drop policy if exists "Allow all on attendance_records" on public.attendance_records;
drop policy if exists "Allow all on attendance_items" on public.attendance_items;
drop policy if exists "Allow all on homework_assignments" on public.homework_assignments;
drop policy if exists "Allow all on homework_submissions" on public.homework_submissions;
drop policy if exists "Allow all on tests" on public.tests;
drop policy if exists "Allow all on test_marks" on public.test_marks;

-- Permissive policies for authenticated users and public demo access
create policy "Allow all on profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all on batches" on public.batches for all using (true) with check (true);
create policy "Allow all on students" on public.students for all using (true) with check (true);
create policy "Allow all on attendance_records" on public.attendance_records for all using (true) with check (true);
create policy "Allow all on attendance_items" on public.attendance_items for all using (true) with check (true);
create policy "Allow all on homework_assignments" on public.homework_assignments for all using (true) with check (true);
create policy "Allow all on homework_submissions" on public.homework_submissions for all using (true) with check (true);
create policy "Allow all on tests" on public.tests for all using (true) with check (true);
create policy "Allow all on test_marks" on public.test_marks for all using (true) with check (true);

-- Enable Realtime safely (ignores error if already added)
do $$
begin
  alter publication supabase_realtime add table public.batches;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.students;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.attendance_records;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.homework_assignments;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tests;
exception when others then null;
end $$;

-- ==============================================================================
-- 10. Automatic User Profile Creation Trigger
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'teacher')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = coalesce(excluded.role, public.profiles.role),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profile records for any existing auth users
insert into public.profiles (id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  coalesce(raw_user_meta_data->>'role', 'teacher')
from auth.users
on conflict (id) do update set
  email = excluded.email,
  updated_at = now();

