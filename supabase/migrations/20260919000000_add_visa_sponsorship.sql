-- ========================================================
-- Migration: Add Visa Sponsorship Column to job_applications
-- Date: 2026-09-19
-- Purpose:
--   1. Add visa_sponsorship column with default 'no'
--   2. Add index on visa_sponsorship for query performance
-- ========================================================

ALTER TABLE public.job_applications 
    ADD COLUMN IF NOT EXISTS visa_sponsorship TEXT DEFAULT 'no';

CREATE INDEX IF NOT EXISTS idx_job_applications_visa_sponsorship 
    ON public.job_applications(visa_sponsorship);

