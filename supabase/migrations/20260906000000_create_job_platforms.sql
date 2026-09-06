-- ========================================================
-- Migration: Create job_platforms Table & Link to Applications
-- Date: 2026-09-06
-- Purpose: Store user-defined job search platforms (global or
--          country-specific) and connect both tables via platform_id.
-- ========================================================

CREATE TABLE IF NOT EXISTS public.job_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  scope TEXT DEFAULT 'global',
  countries TEXT[],
  notes TEXT
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_job_platforms_created_at ON public.job_platforms(created_at ASC);

-- Enable RLS
ALTER TABLE public.job_platforms ENABLE ROW LEVEL SECURITY;

-- Allow full access for personal use / anon client
CREATE POLICY "Allow full access to job_platforms" ON public.job_platforms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Connect job_applications to job_platforms
ALTER TABLE public.job_applications 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.job_platforms(id) ON DELETE SET NULL;

-- Connect saved_job_links to job_platforms
ALTER TABLE public.saved_job_links 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.job_platforms(id) ON DELETE SET NULL;

-- Indices for foreign key queries
CREATE INDEX IF NOT EXISTS idx_job_applications_platform_id ON public.job_applications(platform_id);
CREATE INDEX IF NOT EXISTS idx_saved_job_links_platform_id ON public.saved_job_links(platform_id);
