-- ========================================================
-- Migration: Create saved_job_links Table (Apply Later)
-- Date: 2026-09-05
-- ========================================================

CREATE TABLE IF NOT EXISTS public.saved_job_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  url TEXT NOT NULL,
  company_name TEXT,
  role_name TEXT,
  location TEXT,
  source TEXT,
  notes TEXT,
  deadline TEXT,
  salary_note TEXT,
  status TEXT DEFAULT 'saved'
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_saved_job_links_status ON public.saved_job_links(status);
CREATE INDEX IF NOT EXISTS idx_saved_job_links_created_at ON public.saved_job_links(created_at DESC);

-- Enable RLS
ALTER TABLE public.saved_job_links ENABLE ROW LEVEL SECURITY;

-- Allow full access for personal use / anon client (consistent with single-user app)
CREATE POLICY "Allow full access to saved_job_links" ON public.saved_job_links
  FOR ALL
  USING (true)
  WITH CHECK (true);

