-- ==============================================================================
-- Cleanup Query: Delete Applied Saved Links from Apply Later Backlog
-- ==============================================================================
-- This query cleans up rows in public.saved_job_links that:
-- 1. Have status = 'applied' (historical records converted to active applications)
-- 2. OR whose URL already exists in public.job_applications (application_link)
-- ==============================================================================

-- 1. Preview rows to be deleted (run this first if you want to inspect them)
-- SELECT id, company_name, role_name, url, status, created_at
-- FROM public.saved_job_links sjl
-- WHERE sjl.status = 'applied'
--    OR EXISTS (
--      SELECT 1 FROM public.job_applications ja
--      WHERE ja.application_link IS NOT NULL 
--        AND TRIM(ja.application_link) <> ''
--        AND LOWER(TRIM(ja.application_link)) = LOWER(TRIM(sjl.url))
--    );

-- 2. Execute deletion
DELETE FROM public.saved_job_links sjl
WHERE sjl.status = 'applied'
   OR EXISTS (
     SELECT 1 FROM public.job_applications ja
     WHERE ja.application_link IS NOT NULL 
       AND TRIM(ja.application_link) <> ''
       AND LOWER(TRIM(ja.application_link)) = LOWER(TRIM(sjl.url))
   );
