-- ========================================================
-- Query to export existing jobs (Applications + Apply Later)
-- to populate the Google Sheet tracking backlog
-- ========================================================

SELECT 
  COALESCE(ja.company_name, 'Unknown') AS "Company Name",
  COALESCE(ja.role_name, 'Data Engineer') AS "Role Title",
  CONCAT_WS(', ', NULLIF(ja.city, ''), NULLIF(ja.country, '')) AS "Location",
  CASE 
    WHEN ja.country ILIKE '%India%' THEN 'India'
    WHEN ja.country IN ('Germany', 'Netherlands', 'Sweden', 'UK', 'United Kingdom', 'Ireland', 'France', 'Spain', 'Poland', 'Estonia', 'Switzerland', 'Denmark', 'Norway', 'Finland') THEN 'EU / UK'
    WHEN ja.country IN ('Singapore', 'Japan', 'Australia', 'New Zealand', 'UAE', 'Dubai') THEN 'APAC'
    ELSE 'International'
  END AS "Region",
  COALESCE(ja.application_link, '') AS "Job URL",
  CASE 
    WHEN ja.visa_sponsorship = 'yes' THEN 'Yes (Sponsored)'
    WHEN ja.visa_sponsorship = 'maybe' THEN 'Potential'
    WHEN ja.visa_sponsorship = 'no' THEN 'No'
    ELSE 'Not Specified'
  END AS "Visa / Relocation Support",
  CASE 
    WHEN ja.salary_min IS NOT NULL OR ja.salary_max IS NOT NULL THEN 
      CONCAT_WS(' - ', ja.salary_min::text, ja.salary_max::text) || ' ' || COALESCE(ja.salary_currency, '')
    ELSE ''
  END AS "Salary / Compensation",
  CASE 
    WHEN ja.ats_score IS NOT NULL THEN ja.ats_score::text || '%'
    ELSE ''
  END AS "Estimated ATS Match Score",
  'Distributed Systems, BigQuery, CDC, Java, Python' AS "Matching Core Skills",
  COALESCE(ja.found_in, 'Direct') AS "Source / Platform",
  CASE 
    WHEN jas.status = 'not selected' THEN 'Rejected'
    WHEN jas.status IS NOT NULL THEN INITCAP(jas.status)
    ELSE 'Applied'
  END AS "Status",
  COALESCE(ja.applied_date::text, ja.created_at::date::text) AS "Date Added / Applied",
  COALESCE(ja.follow_up_notes, '') AS "Notes / Why It Fits"
FROM public.job_applications ja
LEFT JOIN public.job_applications_status jas ON ja.status_id = jas.id

UNION ALL

SELECT
  COALESCE(sjl.company_name, 'To Research') AS "Company Name",
  COALESCE(sjl.role_name, 'Data Engineer') AS "Role Title",
  COALESCE(sjl.location, 'Remote / Unspecified') AS "Location",
  'EU / APAC' AS "Region",
  sjl.url AS "Job URL",
  'To Verify' AS "Visa / Relocation Support",
  COALESCE(sjl.salary_note, '') AS "Salary / Compensation",
  '' AS "Estimated ATS Match Score",
  'CDC, GCP, Java, Python, BigQuery' AS "Matching Core Skills",
  COALESCE(sjl.source, 'Apply Later') AS "Source / Platform",
  CASE 
    WHEN sjl.status = 'applied' THEN 'Applied'
    ELSE 'To Apply'
  END AS "Status",
  sjl.created_at::date::text AS "Date Added / Applied",
  COALESCE(sjl.notes, 'Apply Later Backlog') AS "Notes / Why It Fits"
FROM public.saved_job_links sjl

ORDER BY "Date Added / Applied" DESC;
