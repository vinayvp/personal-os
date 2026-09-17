-- ========================================================
-- Migration: Move Job Application Status to job_applications_status Table
-- Date: 2026-09-17
-- Purpose:
--   1. Create job_applications_status table with created_at and updated_at
--   2. Reference job_applications_status(id) from job_applications(status_id)
--   3. Migrate existing applications status, preserving created_at and updated_at
--   4. Safely drop legacy index and status column with CASCADE
-- ========================================================

-- 1. Create the new job_applications_status table
CREATE TABLE IF NOT EXISTS public.job_applications_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'applied',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row-Level Security and set public policies
ALTER TABLE public.job_applications_status ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_applications_status' 
          AND policyname = 'Allow full access to job_applications_status'
    ) THEN
        CREATE POLICY "Allow full access to job_applications_status" 
        ON public.job_applications_status 
        FOR ALL TO anon, authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- 3. Add foreign key column status_id to job_applications
ALTER TABLE public.job_applications 
    ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES public.job_applications_status(id) ON DELETE SET NULL;

-- 4. Migrate existing data: create status records copying applied_date (or created_at) & updated_at, link status_id
DO $$
DECLARE
    r RECORD;
    new_st_id UUID;
    has_status_col BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'job_applications' 
          AND column_name = 'status'
    ) INTO has_status_col;

    IF has_status_col THEN
        FOR r IN EXECUTE 'SELECT id, COALESCE(status, ''applied'') as cur_status, 
                          CASE 
                            WHEN applied_date IS NOT NULL AND applied_date::text ~ ''^\d{4}-\d{2}-\d{2}'' THEN applied_date::timestamptz 
                            ELSE COALESCE(created_at, now()) 
                          END as st_created_at, 
                          updated_at 
                          FROM public.job_applications 
                          WHERE status_id IS NULL'
        LOOP
            INSERT INTO public.job_applications_status (status, created_at, updated_at)
            VALUES (r.cur_status, r.st_created_at, r.updated_at)
            RETURNING id INTO new_st_id;

            UPDATE public.job_applications
            SET status_id = new_st_id
            WHERE id = r.id;
        END LOOP;
    ELSE
        FOR r IN SELECT id, 
                        CASE 
                          WHEN applied_date IS NOT NULL AND applied_date::text ~ '^\d{4}-\d{2}-\d{2}' THEN applied_date::timestamptz 
                          ELSE COALESCE(created_at, now()) 
                        END as st_created_at, 
                        updated_at 
                 FROM public.job_applications 
                 WHERE status_id IS NULL
        LOOP
            INSERT INTO public.job_applications_status (status, created_at, updated_at)
            VALUES ('applied', r.st_created_at, r.updated_at)
            RETURNING id INTO new_st_id;

            UPDATE public.job_applications
            SET status_id = new_st_id
            WHERE id = r.id;
        END LOOP;
    END IF;
END $$;

-- 5. Sync status created_at with applied_date for any existing linked status records
UPDATE public.job_applications_status jas
SET created_at = ja.applied_date::timestamptz
FROM public.job_applications ja
WHERE ja.status_id = jas.id
  AND ja.applied_date IS NOT NULL
  AND ja.applied_date::text ~ '^\d{4}-\d{2}-\d{2}';

-- 6. Safely drop legacy index and status column outside the DO block
DROP INDEX IF EXISTS public.idx_job_applications_status;
ALTER TABLE public.job_applications DROP COLUMN IF EXISTS status CASCADE;

-- 7. Add indices for query performance
CREATE INDEX IF NOT EXISTS idx_job_applications_status_id ON public.job_applications(status_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status_status ON public.job_applications_status(status);
