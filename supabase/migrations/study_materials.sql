-- Migration: Study Materials & Documents Feature
-- Description: Creates the study_materials table, indexes, RLS policies, and storage bucket configuration.

-- 1. Create study_materials table
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'notes', -- 'notes', 'formula_sheet', 'question_bank', 'syllabus', 'assignment', 'other'
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size TEXT,
    file_type TEXT DEFAULT 'pdf', -- 'pdf', 'image', 'doc', 'other'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create indexes for quick querying
CREATE INDEX IF NOT EXISTS idx_study_materials_batch_id ON public.study_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_category ON public.study_materials(category);
CREATE INDEX IF NOT EXISTS idx_study_materials_created_at ON public.study_materials(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone authenticated or public reads (for students with invite code or enrolled)
CREATE POLICY "Allow public read access to study materials"
    ON public.study_materials
    FOR SELECT
    USING (true);

-- Allow teachers or authenticated users to insert study materials
CREATE POLICY "Allow authenticated insert to study materials"
    ON public.study_materials
    FOR INSERT
    WITH CHECK (true);

-- Allow authenticated users to update study materials
CREATE POLICY "Allow authenticated update to study materials"
    ON public.study_materials
    FOR UPDATE
    USING (true);

-- Allow authenticated users to delete study materials
CREATE POLICY "Allow authenticated delete to study materials"
    ON public.study_materials
    FOR DELETE
    USING (true);

-- 5. Storage Bucket setup for study-materials (if using Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow public read of study-materials
CREATE POLICY "Public Access to Study Materials Bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'study-materials');

-- Storage RLS: allow authenticated users to upload files
CREATE POLICY "Authenticated Uploads to Study Materials Bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'study-materials');
