-- ========================================================
-- Migration: Add ATS Score and Follow-ups to Job Applications
-- Date: 2026-09-11
-- Purpose: Support tracking ATS match scores and multiple follow-up logs
-- ========================================================

-- Add ats_score (numeric, e.g. 0 - 100)
ALTER TABLE public.job_applications 
  ADD COLUMN IF NOT EXISTS ats_score NUMERIC;

-- Add follow_ups as JSONB array of follow-up objects
ALTER TABLE public.job_applications 
  ADD COLUMN IF NOT EXISTS follow_ups JSONB DEFAULT '[]'::jsonb;

-- Index for ats_score sorting and filtering
CREATE INDEX IF NOT EXISTS idx_job_applications_ats_score 
  ON public.job_applications(ats_score);

