-- ========================================================
-- Migration: Create job_platforms Table
-- Date: 2026-09-06
-- Purpose: Store curated and user-added job search platforms
--          (global or country-specific) with URL and notes.
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

-- Allow full access for personal use / anon client (consistent with single-user app)
CREATE POLICY "Allow full access to job_platforms" ON public.job_platforms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed initial popular platforms
INSERT INTO public.job_platforms (name, url, scope, countries, notes) VALUES
  ('LinkedIn', 'https://www.linkedin.com/jobs', 'global', NULL, 'Primary professional network, direct Easy Apply and enterprise job postings.'),
  ('Indeed', 'https://www.indeed.com', 'global', NULL, 'Largest comprehensive job search aggregator worldwide.'),
  ('Wellfound (AngelList)', 'https://wellfound.com/jobs', 'global', NULL, 'Premier platform for early-stage to Series C startups and equity transparency.'),
  ('Y Combinator Work at a Startup', 'https://www.workatastartup.com', 'global', NULL, 'Direct hiring portal connecting candidates directly with Y Combinator founders.'),
  ('Otta (Welcome to the Jungle)', 'https://app.otta.com', 'specific', ARRAY['United States', 'United Kingdom', 'European Union'], 'Curated tech and startup opportunities with verified salary bands.'),
  ('Glassdoor', 'https://www.glassdoor.com/Job', 'global', NULL, 'Job openings paired with company culture ratings, salary reports, and interview reviews.'),
  ('Levels.fyi Jobs', 'https://www.levels.fyi/jobs', 'global', NULL, 'Verified high-compensation engineering, product, and leadership openings.'),
  ('We Work Remotely', 'https://weworkremotely.com', 'global', NULL, 'Top community for 100% remote software development and tech roles.'),
  ('RemoteOK', 'https://remoteok.com', 'global', NULL, 'Global remote job listings for engineers and digital nomads.'),
  ('Naukri', 'https://www.naukri.com', 'specific', ARRAY['India'], 'Major job board in India for tech, IT services, and enterprise companies.'),
  ('Instahyre', 'https://www.instahyre.com', 'specific', ARRAY['India'], 'Curated tech talent portal matching top engineering candidates in India.'),
  ('StepStone', 'https://www.stepStone.de', 'specific', ARRAY['Germany', 'European Union'], 'Leading job board across Germany, Austria, and broader DACH region.'),
  ('Relocate.me', 'https://relocate.me', 'specific', ARRAY['European Union', 'United Kingdom', 'Canada'], 'Tech jobs providing verified international visa sponsorship and relocation support.');
