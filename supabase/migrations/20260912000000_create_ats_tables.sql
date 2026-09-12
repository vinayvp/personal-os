-- ========================================================
-- Migration: Create ats_platforms & job_application_ats_scores Tables
-- Date: 2026-09-12
-- Purpose: Store ATS platforms/scanners in a dedicated table,
--          track individual ATS score evaluations per job application,
--          and keep the calculated average in job_applications.ats_score.
-- ========================================================

-- 1. Table: ats_platforms
CREATE TABLE IF NOT EXISTS public.ats_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL UNIQUE,
  url TEXT,
  is_default BOOLEAN DEFAULT false
);

-- Index for ats_platforms
CREATE INDEX IF NOT EXISTS idx_ats_platforms_name ON public.ats_platforms(name);
CREATE INDEX IF NOT EXISTS idx_ats_platforms_is_default ON public.ats_platforms(is_default);

-- Enable RLS for ats_platforms
ALTER TABLE public.ats_platforms ENABLE ROW LEVEL SECURITY;

-- Allow full access to ats_platforms for anon and authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ats_platforms' 
    AND policyname = 'Allow access to ats_platforms'
  ) THEN
    CREATE POLICY "Allow access to ats_platforms" 
    ON public.ats_platforms
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Seed default ATS platforms (if not already existing)
INSERT INTO public.ats_platforms (name, url, is_default)
VALUES
  ('ChatGPT', 'https://chatgpt.com', true),
  ('Jobscan', 'https://www.jobscan.co', true),
  ('Resume Worded', 'https://resumeworded.com', true),
  ('Teal', 'https://www.tealhq.com', true),
  ('Cultivated Culture', 'https://cultivatedculture.com', true),
  ('SkillSyncer', 'https://skillsyncer.com', true),
  ('Careerflow', 'https://careerflow.ai', true)
ON CONFLICT (name) DO UPDATE SET
  url = EXCLUDED.url,
  is_default = EXCLUDED.is_default;

-- 2. Table: job_application_ats_scores
CREATE TABLE IF NOT EXISTS public.job_application_ats_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  job_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES public.ats_platforms(id) ON DELETE SET NULL,
  platform_name TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100)
);

-- Indices for rapid querying & foreign keys
CREATE INDEX IF NOT EXISTS idx_job_ats_scores_job_id 
  ON public.job_application_ats_scores(job_id);

CREATE INDEX IF NOT EXISTS idx_job_ats_scores_platform_id 
  ON public.job_application_ats_scores(platform_id);

-- Enable RLS for job_application_ats_scores
ALTER TABLE public.job_application_ats_scores ENABLE ROW LEVEL SECURITY;

-- Allow full access to job_application_ats_scores for anon and authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_application_ats_scores' 
    AND policyname = 'Allow access to job_application_ats_scores'
  ) THEN
    CREATE POLICY "Allow access to job_application_ats_scores" 
    ON public.job_application_ats_scores
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

