-- ==========================================
-- Migration: Create Job Applications Table & Private Resumes Storage
-- Date: 2026-09-04
-- ==========================================

-- 1. Create Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  company_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  job_type TEXT,
  status TEXT NOT NULL DEFAULT 'applied',
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'USD',
  salary_min_inr NUMERIC,
  salary_max_inr NUMERIC,
  salary_inr_rate NUMERIC,
  resume_url TEXT,
  resume_filename TEXT,
  resume_storage_path TEXT,
  application_link TEXT,
  found_in TEXT,
  job_description TEXT,
  recruiter_email TEXT,
  recruiter_phone TEXT,
  follow_up_notes TEXT
);

-- Ensure job_type column exists if table was already created
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS job_type TEXT;

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_country ON public.job_applications(country);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date ON public.job_applications(applied_date DESC);

-- Enable Row-Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Allow access to job_applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_applications' 
    AND policyname = 'Allow access to job_applications'
  ) THEN
    CREATE POLICY "Allow access to job_applications" 
    ON public.job_applications
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ==========================================
-- 2. Create Private Storage Bucket for Resumes
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-resumes', 'job-resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Allow uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Allow uploads to job-resumes'
  ) THEN
    CREATE POLICY "Allow uploads to job-resumes"
    ON storage.objects FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'job-resumes');
  END IF;
END $$;

-- Allow signed URL generation / read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Allow read from job-resumes'
  ) THEN
    CREATE POLICY "Allow read from job-resumes"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'job-resumes');
  END IF;
END $$;

-- Allow delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Allow delete from job-resumes'
  ) THEN
    CREATE POLICY "Allow delete from job-resumes"
    ON storage.objects FOR DELETE TO anon, authenticated
    USING (bucket_id = 'job-resumes');
  END IF;
END $$;


