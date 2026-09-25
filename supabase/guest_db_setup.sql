-- ==============================================================================
-- TURNKEY GUEST DATABASE SETUP & MIGRATION SCRIPT
-- Project: Vinayak Portfolio & Sub-Apps (Guest Mode)
-- 
-- Instructions:
-- 1. Open your Guest Supabase Dashboard (SQL Editor -> New Query).
-- 2. Paste this ENTIRE script (ensure no text is highlighted) and click "Run".
-- 3. CRITICAL FOR FINANCE APP:
--    In your Supabase Dashboard -> Project Settings (gear icon ⚙️) -> API
--    Scroll down to "Data API Settings" (or "PostgREST Configuration")
--    Under "Exposed schemas", add: finance  (so it reads: public, finance)
--    Click "Save". This allows PostgREST to serve the finance schema via API!
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. HABIT TRACKER (habits & habit_completions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    name TEXT,
    color TEXT DEFAULT '#10B981',
    icon TEXT DEFAULT 'fitness_center',
    frequency_type TEXT DEFAULT 'daily',
    target_count INTEGER DEFAULT 1,
    target_period TEXT DEFAULT 'weekly',
    custom_days INTEGER[] DEFAULT NULL,
    goal TEXT DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotent column additions in case table was created earlier
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10B981';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'fitness_center';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS frequency_type TEXT DEFAULT 'daily';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS target_count INTEGER DEFAULT 1;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS target_period TEXT DEFAULT 'weekly';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS custom_days INTEGER[];
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure frequency_type and target_period check constraints allow modern values ('none' and 'total')
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_frequency_type_check;
ALTER TABLE public.habits ADD CONSTRAINT habits_frequency_type_check CHECK (frequency_type IN ('daily', 'weekly', 'custom', 'none'));
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_target_period_check;
ALTER TABLE public.habits ADD CONSTRAINT habits_target_period_check CHECK (target_period IN ('weekly', 'monthly', 'yearly', 'total'));

-- Ensure both name and title are populated
UPDATE public.habits SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE public.habits SET title = name WHERE title IS NULL AND name IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.habit_completions ADD COLUMN IF NOT EXISTS completion_date DATE;
ALTER TABLE public.habit_completions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT now();

-- ------------------------------------------------------------------------------
-- 2. TODOS (todos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'General',
    status TEXT DEFAULT 'pending',
    completed BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ------------------------------------------------------------------------------
-- 3. NOTES & TAGS (notes, tags, note_tags)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'General',
    is_pinned BOOLEAN DEFAULT false,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS markdown_content TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS folder TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS notion_url TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

CREATE TABLE IF NOT EXISTS public.note_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(note_id, tag_id)
);

-- ------------------------------------------------------------------------------
-- 4. LESSONS LEARNED (lesson_categories & lessons)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366F1',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lesson_categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366F1';

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    takeaways TEXT,
    content TEXT,
    category_id UUID REFERENCES public.lesson_categories(id) ON DELETE SET NULL,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS takeaways TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.lesson_categories(id) ON DELETE SET NULL;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
    ALTER TABLE public.lessons ALTER COLUMN content DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

UPDATE public.lessons SET content = description WHERE content IS NULL AND description IS NOT NULL;
UPDATE public.lessons SET description = content WHERE description IS NULL AND content IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 5. MOVIES & TV (movies_tv, movies_categories, movies_platforms)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movies_categories' AND table_type = 'VIEW'
    ) THEN
        EXECUTE 'DROP VIEW public.movies_categories CASCADE';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movies_platforms' AND table_type = 'VIEW'
    ) THEN
        EXECUTE 'DROP VIEW public.movies_platforms CASCADE';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movies_tv' AND table_type = 'VIEW'
    ) THEN
        EXECUTE 'DROP VIEW public.movies_tv CASCADE';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.movies_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#EC4899',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.movies_categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#EC4899';

CREATE TABLE IF NOT EXISTS public.movies_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    url TEXT,
    url_template TEXT,
    icon TEXT DEFAULT 'Tv',
    enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.movies_platforms ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.movies_platforms ADD COLUMN IF NOT EXISTS url_template TEXT;
ALTER TABLE public.movies_platforms ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Tv';
ALTER TABLE public.movies_platforms ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
ALTER TABLE public.movies_platforms ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.movies_platforms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = 'movies_platforms' 
          AND tc.constraint_type = 'UNIQUE' 
          AND kcu.column_name = 'name'
    ) THEN
        ALTER TABLE public.movies_platforms ADD CONSTRAINT movies_platforms_name_key UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.movies_tv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT DEFAULT 'movie',
    imdb_id TEXT,
    imdb_rating NUMERIC DEFAULT NULL,
    imdb_url TEXT,
    status TEXT DEFAULT 'watchlist',
    personal_rating NUMERIC DEFAULT NULL,
    review TEXT,
    poster_url TEXT,
    release_year INTEGER,
    year INTEGER,
    director TEXT,
    genre TEXT,
    runtime TEXT,
    plot TEXT,
    category_id UUID REFERENCES public.movies_categories(id) ON DELETE SET NULL,
    platform_id UUID REFERENCES public.movies_platforms(id) ON DELETE SET NULL,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'movie';
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS imdb_id TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS imdb_rating NUMERIC;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS imdb_url TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'watchlist';
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS personal_rating NUMERIC;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS release_year TEXT;
ALTER TABLE public.movies_tv ALTER COLUMN release_year TYPE TEXT USING release_year::TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS director TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS runtime TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS plot TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS custom_category TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS imdb_score TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS rotten_tomatoes_rating TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS rated TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS watched BOOLEAN DEFAULT false;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS actors TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS directors TEXT;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.movies_categories(id) ON DELETE SET NULL;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.movies_platforms(id) ON DELETE SET NULL;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.movies_tv ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE public.movies_tv SET release_year = year::TEXT WHERE release_year IS NULL AND year IS NOT NULL;
UPDATE public.movies_tv SET year = CAST(NULLIF(regexp_replace(release_year, '[^0-9]', '', 'g'), '') AS INTEGER) WHERE year IS NULL AND release_year IS NOT NULL;

-- Safely drop legacy base tables if they exist so views can be created without ERROR 42809
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movies' AND table_type = 'BASE TABLE'
    ) THEN
        EXECUTE 'DROP TABLE public.movies CASCADE';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movie_categories' AND table_type = 'BASE TABLE'
    ) THEN
        EXECUTE 'DROP TABLE public.movie_categories CASCADE';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movie_platforms' AND table_type = 'BASE TABLE'
    ) THEN
        EXECUTE 'DROP TABLE public.movie_platforms CASCADE';
    END IF;
END $$;

-- Drop and recreate backwards compatibility aliases/views to avoid 42P16 column mismatch errors
DROP VIEW IF EXISTS public.movies CASCADE;
DROP VIEW IF EXISTS public.movie_categories CASCADE;
DROP VIEW IF EXISTS public.movie_platforms CASCADE;

CREATE OR REPLACE VIEW public.movies AS SELECT * FROM public.movies_tv;
CREATE OR REPLACE VIEW public.movie_categories AS SELECT * FROM public.movies_categories;
CREATE OR REPLACE VIEW public.movie_platforms AS SELECT * FROM public.movies_platforms;

-- ------------------------------------------------------------------------------
-- 6. REVISION & SPACED REPETITION (revision_category & revision_element)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'revision_category' AND table_type = 'VIEW'
    ) THEN
        EXECUTE 'DROP VIEW public.revision_category CASCADE';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'revision_element' AND table_type = 'VIEW'
    ) THEN
        EXECUTE 'DROP VIEW public.revision_element CASCADE';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.revision_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#8B5CF6',
    count INTEGER DEFAULT 0,
    curr_element_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.revision_category ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#8B5CF6';
ALTER TABLE public.revision_category ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 0;
ALTER TABLE public.revision_category ADD COLUMN IF NOT EXISTS curr_element_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = 'revision_category' 
          AND tc.constraint_type = 'UNIQUE' 
          AND kcu.column_name = 'name'
    ) THEN
        ALTER TABLE public.revision_category ADD CONSTRAINT revision_category_name_key UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.revision_element (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    name TEXT,
    content TEXT NOT NULL,
    category_id UUID REFERENCES public.revision_category(id) ON DELETE SET NULL,
    difficulty TEXT DEFAULT 'medium',
    next_review_date TIMESTAMPTZ DEFAULT now(),
    review_count INTEGER DEFAULT 0,
    count INTEGER DEFAULT 0,
    interval_days INTEGER DEFAULT 1,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 0;
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 1;
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.revision_element ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
    ALTER TABLE public.revision_element ALTER COLUMN name DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

UPDATE public.revision_element SET title = name WHERE title IS NULL AND name IS NOT NULL;
UPDATE public.revision_element SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE public.revision_element SET review_count = count WHERE review_count IS NULL AND count IS NOT NULL;
UPDATE public.revision_element SET count = review_count WHERE count IS NULL AND review_count IS NOT NULL;

-- Add foreign key constraint for curr_element_id after table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'revision_category_curr_element_id_fkey'
    ) THEN
        ALTER TABLE public.revision_category 
        ADD CONSTRAINT revision_category_curr_element_id_fkey 
        FOREIGN KEY (curr_element_id) REFERENCES public.revision_element(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Safely drop legacy base tables if they exist so views can be created without ERROR 42809
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'revision_categories' AND table_type = 'BASE TABLE'
    ) THEN
        EXECUTE 'DROP TABLE public.revision_categories CASCADE';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'revision_elements' AND table_type = 'BASE TABLE'
    ) THEN
        EXECUTE 'DROP TABLE public.revision_elements CASCADE';
    END IF;
END $$;

-- Drop and recreate plural aliases/views to avoid 42P16 column mismatch errors
DROP VIEW IF EXISTS public.revision_categories CASCADE;
DROP VIEW IF EXISTS public.revision_elements CASCADE;

CREATE OR REPLACE VIEW public.revision_categories AS SELECT * FROM public.revision_category;
CREATE OR REPLACE VIEW public.revision_elements AS SELECT * FROM public.revision_element;

-- ------------------------------------------------------------------------------
-- 7. JOURNAL (journal_entries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    content TEXT,
    mood TEXT DEFAULT 'productive',
    tags TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    word_count INTEGER DEFAULT 0,
    rich_content JSONB DEFAULT NULL,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT 'productive';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS rich_content JSONB;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ------------------------------------------------------------------------------
-- 8. JOB TRACKER (job_applications, saved_job_links, job_platforms, ats_platforms, job_application_ats_scores)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ats_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    url TEXT,
    is_default BOOLEAN DEFAULT false,
    description TEXT,
    icon TEXT DEFAULT 'BarChart2',
    color TEXT DEFAULT '#6366F1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ats_platforms ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.ats_platforms ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.ats_platforms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.ats_platforms ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'BarChart2';
ALTER TABLE public.ats_platforms ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366F1';
ALTER TABLE public.ats_platforms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.ats_platforms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = 'ats_platforms' 
          AND tc.constraint_type = 'UNIQUE' 
          AND kcu.column_name = 'name'
    ) THEN
        ALTER TABLE public.ats_platforms ADD CONSTRAINT ats_platforms_name_key UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.job_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    url TEXT,
    scope TEXT DEFAULT 'global',
    countries TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    icon TEXT DEFAULT 'Briefcase',
    color TEXT DEFAULT '#3B82F6',
    is_default BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'global';
ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS countries TEXT[] DEFAULT '{}';
ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Briefcase';
ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.job_platforms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = 'job_platforms' 
          AND tc.constraint_type = 'UNIQUE' 
          AND kcu.column_name = 'name'
    ) THEN
        ALTER TABLE public.job_platforms ADD CONSTRAINT job_platforms_name_key UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.job_applications_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'applied',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_applications_status ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications_status' AND policyname = 'Allow public read access to job_applications_status') THEN
        CREATE POLICY "Allow public read access to job_applications_status" ON public.job_applications_status FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications_status' AND policyname = 'Allow public insert to job_applications_status') THEN
        CREATE POLICY "Allow public insert to job_applications_status" ON public.job_applications_status FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications_status' AND policyname = 'Allow public update to job_applications_status') THEN
        CREATE POLICY "Allow public update to job_applications_status" ON public.job_applications_status FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications_status' AND policyname = 'Allow public delete to job_applications_status') THEN
        CREATE POLICY "Allow public delete to job_applications_status" ON public.job_applications_status FOR DELETE USING (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_id UUID REFERENCES public.job_applications_status(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    role_name TEXT NOT NULL,
    job_type TEXT DEFAULT 'Full-time',
    city TEXT DEFAULT 'Remote',
    country TEXT DEFAULT 'India',
    salary_min NUMERIC DEFAULT NULL,
    salary_max NUMERIC DEFAULT NULL,
    salary_currency TEXT DEFAULT 'INR',
    salary_min_inr NUMERIC DEFAULT NULL,
    salary_max_inr NUMERIC DEFAULT NULL,
    salary_inr_rate NUMERIC DEFAULT NULL,
    resume_url TEXT DEFAULT NULL,
    resume_filename TEXT DEFAULT NULL,
    resume_storage_path TEXT DEFAULT NULL,
    cover_letter_filename TEXT DEFAULT NULL,
    cover_letter_storage_path TEXT DEFAULT NULL,
    application_link TEXT DEFAULT NULL,
    chatgpt_thread_link TEXT DEFAULT NULL,
    platform_id UUID REFERENCES public.job_platforms(id) ON DELETE SET NULL,
    platform TEXT DEFAULT 'LinkedIn',
    found_in TEXT DEFAULT NULL,
    job_description TEXT DEFAULT NULL,
    recruiter_email TEXT DEFAULT NULL,
    recruiter_phone TEXT DEFAULT NULL,
    applied_date DATE DEFAULT CURRENT_DATE,
    ats_score NUMERIC DEFAULT NULL,
    follow_ups JSONB DEFAULT '[]'::jsonb,
    follow_up_notes TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES public.job_applications_status(id) ON DELETE SET NULL;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS role_name TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'Full-time';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Remote';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS salary_min NUMERIC;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS salary_max NUMERIC;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'INR';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS salary_min_inr NUMERIC;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS salary_max_inr NUMERIC;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS salary_inr_rate NUMERIC;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS resume_filename TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS resume_storage_path TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS cover_letter_filename TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS cover_letter_storage_path TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS application_link TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS chatgpt_thread_link TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.job_platforms(id) ON DELETE SET NULL;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'LinkedIn';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS found_in TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS job_description TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS recruiter_email TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS recruiter_phone TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applied_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS ats_score NUMERIC;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS follow_ups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS visa_sponsorship TEXT DEFAULT 'no';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Migration: populate job_applications_status for existing job_applications and link status_id
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

-- Sync status created_at with applied_date for any existing linked status records
UPDATE public.job_applications_status jas
SET created_at = ja.applied_date::timestamptz
FROM public.job_applications ja
WHERE ja.status_id = jas.id
  AND ja.applied_date IS NOT NULL
  AND ja.applied_date::text ~ '^\d{4}-\d{2}-\d{2}';

-- Drop legacy index and column safely outside DO block with CASCADE
DROP INDEX IF EXISTS public.idx_job_applications_status;
ALTER TABLE public.job_applications DROP COLUMN IF EXISTS status CASCADE;
CREATE INDEX IF NOT EXISTS idx_job_applications_status_id ON public.job_applications(status_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status_status ON public.job_applications_status(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_visa_sponsorship ON public.job_applications(visa_sponsorship);

CREATE TABLE IF NOT EXISTS public.saved_job_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    company_name TEXT,
    role_name TEXT,
    source TEXT DEFAULT 'LinkedIn',
    platform_id UUID REFERENCES public.job_platforms(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'to_apply',
    salary TEXT,
    salary_note TEXT,
    location TEXT,
    notes TEXT,
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS role_name TEXT;
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'LinkedIn';
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.job_platforms(id) ON DELETE SET NULL;
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'to_apply';
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS salary TEXT;
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS salary_note TEXT;
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.saved_job_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.job_application_ats_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,
    platform_id UUID REFERENCES public.ats_platforms(id) ON DELETE SET NULL,
    platform_name TEXT NOT NULL,
    score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
    checked_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_application_ats_scores ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE;
ALTER TABLE public.job_application_ats_scores ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE;
ALTER TABLE public.job_application_ats_scores ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.ats_platforms(id) ON DELETE SET NULL;
ALTER TABLE public.job_application_ats_scores ADD COLUMN IF NOT EXISTS platform_name TEXT DEFAULT 'ATS';
ALTER TABLE public.job_application_ats_scores ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT 0;
ALTER TABLE public.job_application_ats_scores ADD COLUMN IF NOT EXISTS checked_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.job_application_ats_scores ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.job_application_ats_scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
    ALTER TABLE public.job_application_ats_scores ALTER COLUMN job_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.job_application_ats_scores ALTER COLUMN application_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Public SIP Investments table (legacy/compatibility)
CREATE TABLE IF NOT EXISTS public.sip_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT DEFAULT 'Mutual Fund',
    debit_date INTEGER DEFAULT 5,
    expected_return_rate NUMERIC DEFAULT 12,
    start_date DATE DEFAULT CURRENT_DATE,
    user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sip_investments ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Mutual Fund';
ALTER TABLE public.sip_investments ADD COLUMN IF NOT EXISTS debit_date INTEGER DEFAULT 5;
ALTER TABLE public.sip_investments ADD COLUMN IF NOT EXISTS expected_return_rate NUMERIC DEFAULT 12;
ALTER TABLE public.sip_investments ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.sip_investments ADD COLUMN IF NOT EXISTS user_id UUID;

-- ------------------------------------------------------------------------------
-- 9. FINANCE SCHEMA (finance.asset_types, platforms, investments, transactions, sips, valuations)
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS finance;

CREATE TABLE IF NOT EXISTS finance.asset_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.investment_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'Broker',
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    asset_type_id UUID REFERENCES finance.asset_types(id) ON DELETE SET NULL,
    platform_id UUID REFERENCES finance.investment_platforms(id) ON DELETE SET NULL,
    symbol TEXT,
    currency TEXT DEFAULT 'INR',
    notes TEXT,
    extra_configuration JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.investment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL REFERENCES finance.investments(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL DEFAULT 'buy',
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_invested NUMERIC DEFAULT 0,
    tenure_months INTEGER,
    interest_rate NUMERIC,
    maturity_date DATE,
    quantity NUMERIC DEFAULT 1,
    price_per_unit NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    fees NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.sip_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID REFERENCES finance.investments(id) ON DELETE SET NULL,
    name TEXT,
    amount NUMERIC NOT NULL,
    sip_day INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    frequency TEXT DEFAULT 'monthly',
    execution_day INTEGER DEFAULT 5,
    status TEXT DEFAULT 'active',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    last_executed_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.investment_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID REFERENCES finance.investments(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES finance.investment_transactions(id) ON DELETE SET NULL,
    valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_value NUMERIC NOT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotent column additions for finance schema
ALTER TABLE finance.asset_types ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
ALTER TABLE finance.asset_types ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE finance.asset_types ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE finance.investment_platforms ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Broker';
ALTER TABLE finance.investment_platforms ADD COLUMN IF NOT EXISTS url TEXT;

ALTER TABLE finance.investments ADD COLUMN IF NOT EXISTS asset_type_id UUID REFERENCES finance.asset_types(id) ON DELETE SET NULL;
ALTER TABLE finance.investments ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES finance.investment_platforms(id) ON DELETE SET NULL;
ALTER TABLE finance.investments ADD COLUMN IF NOT EXISTS symbol TEXT;
ALTER TABLE finance.investments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE finance.investments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE finance.investments ADD COLUMN IF NOT EXISTS extra_configuration JSONB DEFAULT NULL;
ALTER TABLE finance.investments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'buy';
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS amount_invested NUMERIC DEFAULT 0;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS tenure_months INTEGER;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS interest_rate NUMERIC;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS maturity_date DATE;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 1;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC DEFAULT 0;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS fees NUMERIC DEFAULT 0;
ALTER TABLE finance.investment_transactions ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS investment_id UUID REFERENCES finance.investments(id) ON DELETE SET NULL;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS sip_day INTEGER DEFAULT 5;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'monthly';
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS execution_day INTEGER DEFAULT 5;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS last_executed_date DATE;
ALTER TABLE finance.sip_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE finance.investment_valuations ADD COLUMN IF NOT EXISTS investment_id UUID REFERENCES finance.investments(id) ON DELETE CASCADE;
ALTER TABLE finance.investment_valuations ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES finance.investment_transactions(id) ON DELETE SET NULL;
ALTER TABLE finance.investment_valuations ADD COLUMN IF NOT EXISTS valuation_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE finance.investment_valuations ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0;
ALTER TABLE finance.investment_valuations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Permissions & Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA finance TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA finance TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA finance TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (Permissive demo access)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Guest public access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Guest public access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', tbl);
    END LOOP;

    FOR tbl IN
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'finance' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE finance.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Guest public access" ON finance.%I;', tbl);
        EXECUTE format('CREATE POLICY "Guest public access" ON finance.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- RICH SAMPLE DATA SEEDING
-- ==============================================================================

-- 1. Seed Habits (Covers all 4 types: Checked-in, Unchecked, No-frequency total goal, and Custom days)
DELETE FROM public.habit_completions WHERE habit_id IN (
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444'
);
DELETE FROM public.habits WHERE id IN (
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444'
);

INSERT INTO public.habits (id, title, name, color, icon, frequency_type, target_count, target_period, custom_days, goal)
VALUES
    -- Type 1: Checked in today (Daily - target 7 per week)
    ('a1111111-1111-1111-1111-111111111111', 'Morning Workout & Stretch', 'Morning Workout & Stretch', '#10B981', 'fitness_center', 'daily', 7, 'weekly', NULL, '45 mins daily'),
    -- Type 2: Unchecked today (Daily - target 7 per week, ready for user check-in with radio circle)
    ('a2222222-2222-2222-2222-222222222222', 'Read Technical Book / Whitepaper', 'Read Technical Book / Whitepaper', '#3B82F6', 'menu_book', 'daily', 7, 'weekly', NULL, '20 pages daily'),
    -- Type 3: No frequency (Total Goal with stepper counter)
    ('a3333333-3333-3333-3333-333333333333', 'Complete 10 System Design Cases', 'Complete 10 System Design Cases', '#8B5CF6', 'laptop', 'none', 10, 'total', NULL, '10 cases total'),
    -- Type 4: Custom days (Mon, Wed, Fri - target 3 per week)
    ('a4444444-4444-4444-4444-444444444444', 'Cold Outreach & Mentorship Calls', 'Cold Outreach & Mentorship Calls', '#06B6D4', 'work', 'custom', 3, 'weekly', ARRAY[1, 3, 5], 'Mon, Wed, Fri')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    frequency_type = EXCLUDED.frequency_type,
    target_count = EXCLUDED.target_count,
    target_period = EXCLUDED.target_period,
    custom_days = EXCLUDED.custom_days,
    goal = EXCLUDED.goal;

INSERT INTO public.habit_completions (habit_id, completion_date)
VALUES
    ('a1111111-1111-1111-1111-111111111111', CURRENT_DATE),
    ('a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 1),
    ('a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 2),
    ('a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 3),
    ('a2222222-2222-2222-2222-222222222222', CURRENT_DATE - 1),
    ('a2222222-2222-2222-2222-222222222222', CURRENT_DATE - 2),
    ('a2222222-2222-2222-2222-222222222222', CURRENT_DATE - 3),
    ('a3333333-3333-3333-3333-333333333333', CURRENT_DATE - 1),
    ('a3333333-3333-3333-3333-333333333333', CURRENT_DATE - 3),
    ('a3333333-3333-3333-3333-333333333333', CURRENT_DATE - 5),
    ('a3333333-3333-3333-3333-333333333333', CURRENT_DATE - 8),
    ('a4444444-4444-4444-4444-444444444444', CURRENT_DATE - 2),
    ('a4444444-4444-4444-4444-444444444444', CURRENT_DATE - 4)
ON CONFLICT DO NOTHING;

-- 2. Seed Todos
INSERT INTO public.todos (title, description, priority, category, status, completed, due_date)
VALUES
    ('Conduct Architectural Review for Distributed Cache', 'Evaluate Redis vs Dragonfly for high-throughput user state session cache.', 'high', 'Engineering', 'pending', false, NOW() + INTERVAL '2 days'),
    ('Prepare Tech Talk Slides: Modern React & Concurrency', 'Highlight React 19 Actions, Server Components, and optimistic state updates.', 'medium', 'Work', 'pending', false, NOW() + INTERVAL '5 days'),
    ('Review Portfolio Guest Mode Architecture', 'Ensure complete data isolation between guest playground and production database.', 'high', 'Projects', 'completed', true, NOW() - INTERVAL '1 day'),
    ('Renew Cloud Infrastructure Subscriptions', 'Verify auto-billing on Vercel, Supabase, and AWS staging accounts.', 'low', 'Admin', 'pending', false, NOW() + INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- -- 3. Seed Notes & Tags
-- -- 3. Seed Notes & Tags
INSERT INTO public.tags (name, color) VALUES
    ('Architecture', '#6366F1'),
    ('Productivity', '#10B981'),
    ('Distributed Systems', '#F59E0B'),
    ('Frontend', '#3B82F6'),
    ('Engineering', '#8B5CF6'),
    ('Performance', '#EC4899')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;

INSERT INTO public.notes (id, title, content, tags, category, is_pinned)
VALUES
    (
        '00000000-0000-0000-0000-000000000010',
        'Distributed Systems: Architecture Blueprint & Consensus',
        '# Distributed Systems: Architecture Blueprint & Consensus

A comprehensive engineering reference for building resilient, fault-tolerant distributed services with high availability and partition tolerance.

---

## 1. Core Principles: CAP & PACELC Theorems

Distributed data systems inherently make trade-offs between consistency, availability, and latency under network partitions.

### The CAP Theorem
According to Eric Brewer''s CAP Theorem, a distributed data store can simultaneously provide at most two of the following guarantees:

1. **Consistency (Linearizability)**: Every read receives the most recent write or an error.
2. **Availability**: Every non-failing node returns a non-error response for every request (without guarantee that it contains the most recent write).
3. **Partition Tolerance**: The network can drop or delay arbitrary messages without crashing the cluster.

> **Important Note:** In physical networks, partitions (*P*) are inevitable due to fiber cuts, switch failures, or GC pauses. Therefore, distributed architectures must choose between **CP** and **AP**.

### The PACELC Model
If there is a **P**artition, how does the system trade off **A**vailability and **C**onsistency? **E**lse, how does the system trade off **L**atency and **C**onsistency?

| System | Partition Mode | Normal Mode | Target Use Case |
| :--- | :---: | :---: | :--- |
| **CockroachDB / Spanner** | CP | PC | Financial Ledgers & ACID Transactions |
| **Apache Cassandra** | AP | PA | Time-Series & High-Ingest Logs |
| **MongoDB (Default)** | CP | PC | Document Catalog with Strong Primary |
| **Amazon DynamoDB** | AP / CP | Configurable | Global Key-Value Storage |

---

## 2. Replication & Consensus Protocol

Consensus algorithms like **Raft** and **Paxos** ensure state machine safety across replicated nodes.

### Raft Consensus State Machine

```typescript
interface RaftNodeState {
  term: number;
  role: ''Leader'' | ''Candidate'' | ''Follower'';
  votedFor: string | null;
  log: Array<{ index: number; term: number; command: string }>;
  commitIndex: number;
  lastApplied: number;
}

// Heartbeat & AppendEntries verification
function handleAppendEntries(state: RaftNodeState, leaderTerm: number): boolean {
  if (leaderTerm < state.term) {
    return false; // Reject stale leader
  }
  state.term = leaderTerm;
  state.role = ''Follower'';
  return true;
}
```

---

## 3. High-Throughput Caching Strategies

Optimizing read latency requires deliberate cache invalidation and write patterns:

- **Cache-Aside (Lazy Loading)**:
  - App reads cache first; on miss, queries DB and populates cache.
  - *Best for*: Read-heavy workloads with intermittent updates.
- **Write-Through**:
  - Writes update cache and DB synchronously.
  - *Best for*: Critical data where cache consistency is paramount.
- **Write-Behind (Write-Back)**:
  - Writes update cache immediately and asynchronously flush to DB in batches.

---

## 4. Production Readiness Checklist

Pre-launch verification for distributed microservices:

- [x] Configure automated health probes (`/healthz` and `/livez`)
- [x] Enable circuit breakers (e.g., resilience4j or envoy retries)
- [x] Implement distributed tracing with OpenTelemetry trace contexts
- [ ] Conduct chaos engineering game-day with simulated network partitions
- [ ] Configure p99 latency alerts with automated runbook links',
        ARRAY['distributed-systems', 'architecture', 'backend'],
        'Architecture',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000020',
        'Engineering Productivity: The 4-Hour Deep Work Protocol',
        '# Engineering Productivity: The 4-Hour Deep Work Protocol

A structured mental performance system designed to eliminate distractions, maximize high-leverage cognitive focus, and build sustainable momentum.

---

## 1. The Core Philosophy

High-impact engineering output is not a function of hours logged in front of a monitor; it is a function of focused intensity:

> "High-Quality Work Produced = (Time Spent) x (Intensity of Focus). If you don''t produce, you won''t thrive—and producing requires mastering the ability to quickly master hard things." — *Cal Newport, Deep Work*

---

## 2. Daily Schedule Architecture

Structuring the day into distinct physiological and cognitive phases:

### Phase 1: Morning Deep Focus Block (08:30 – 11:30)
- **Rules**:
  - Phone in another room on Do Not Disturb.
  - Slack, Discord, and email applications closed.
  - Work exclusively on the single highest-priority engineering challenge of the day.
- **Activities**: Writing core algorithms, refactoring complex modules, architectural RFCs.

### Phase 2: Recharge & Physical Reset (11:30 – 13:00)
- Nutrient-dense meal.
- 30-minute outdoor walk or zone 2 aerobic cardio.
- Disconnection from all backlit screens.

### Phase 3: Collaborative & Shallow Execution (13:30 – 16:30)
- Code reviews and GitHub PR approvals.
- Architecture syncs and team standups.
- Triage Jira tickets and customer bug reports.

---

## 3. Tooling & Workspace Setup

| Category | Tool / Setup | Purpose |
| :--- | :--- | :--- |
| **Terminal & IDE** | Neovim / VS Code + Tmux | Keystroke-driven uninterrupted editing |
| **Window Manager** | Tiling (i3 / Aerospace / Rectangle) | Rapid context navigation without mouse |
| **Audio** | Noise-cancelling headphones + Brown Noise | Dampens conversational audio distractions |
| **Task Management** | Personal OS Tracker + Markdown | Low-friction daily agenda and scratchpads |

---

## 4. Daily Habit Checklist

- [x] Review calendar and decline low-value optional meetings
- [x] Complete morning 90-minute uninterrupted coding block
- [x] Submit code reviews before 14:00 to unblock team members
- [ ] Log key technical decisions and learnings in daily journal
- [ ] Zero unread inbox processing at end of day',
        ARRAY['productivity', 'habits', 'deep-work'],
        'Self-Improvement',
        false
    ),
    (
        '00000000-0000-0000-0000-000000000030',
        'Modern Web Performance & React 19 Architecture',
        '# Modern Web Performance & React 19 Architecture

A practical guide to rendering performance, optimistic UI mutations, concurrent mode features, and bundle optimization.

---

## 1. Core Web Vitals (CWV) Reference

Google''s Core Web Vitals define the technical benchmarks for high-performing user experiences:

### The Essential Metrics
1. **Largest Contentful Paint (LCP)**:
   - Measures perceived loading speed.
   - *Target*: `<= 2.5 seconds`
2. **Interaction to Next Paint (INP)**:
   - Measures overall page responsiveness to user interactions.
   - *Target*: `<= 200 milliseconds`
3. **Cumulative Layout Shift (CLS)**:
   - Measures visual stability and unexpected layout jumping.
   - *Target*: `<= 0.1`

---

## 2. React 19: Server Actions & Optimistic State

React 19 introduces native hooks for form handling and optimistic transitions without external state management boilerplate.

### Optimistic UI Implementation

```typescript
import { useOptimistic, useTransition } from ''react'';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function TodoItem({ todo, onToggle }: { todo: Todo; onToggle: (id: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodo, setOptimisticTodo] = useOptimistic(
    todo,
    (state, update: boolean) => ({ ...state, completed: update })
  );

  const handleClick = () => {
    startTransition(async () => {
      setOptimisticTodo(!optimisticTodo.completed);
      await onToggle(todo.id);
    });
  };

  return (
    <div className={`todo-item ${optimisticTodo.completed ? ''done'' : ''''}`}>
      <input type="checkbox" checked={optimisticTodo.completed} onChange={handleClick} />
      <span>{optimisticTodo.title}</span>
      {isPending && <span className="syncing-indicator">Syncing...</span>}
    </div>
  );
}
```

---

## 3. Performance Optimization Strategies

Key levers for speeding up client-side applications:

- **Code Splitting & Dynamic Imports**:
  - Lazily import heavyweight modals, chart libraries, and data grids using `React.lazy()`:
  ```typescript
  const AnalyticsChart = React.lazy(() => import(''/AnalyticsChart''));
  ```
- **Asset Optimization**:
  - Convert hero images to WebP/AVIF formats with explicit width/height to avoid CLS.
  - Preload critical fonts with `<link rel="preload" as="font" ... crossOrigin="anonymous">`.
- **Memoization Rules of Thumb**:
  - Avoid premature `useMemo` / `useCallback` on cheap calculations.
  - Apply `useMemo` when passing complex objects as dependencies to custom effects or virtualized lists.

---

## 4. Performance Audit Checklist

- [x] Run Lighthouse audit in incognito mode with mobile throttling
- [x] Verify production bundle size with `vite-plugin-visualizer`
- [ ] Profile expensive re-renders using React DevTools Profiler
- [ ] Configure Cache-Control headers with immutable hashing for static chunks',
        ARRAY['frontend', 'react', 'performance'],
        'Engineering',
        false
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    tags = EXCLUDED.tags,
    category = EXCLUDED.category,
    is_pinned = EXCLUDED.is_pinned;

-- Clean and re-link note tags using dynamic lookup by tag name
DELETE FROM public.note_tags WHERE note_id IN (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000030'
);

INSERT INTO public.note_tags (note_id, tag_id)
SELECT n.id, t.id
FROM public.notes n
JOIN public.tags t ON (
    (n.title LIKE 'Distributed Systems%' AND t.name IN ('Architecture', 'Distributed Systems'))
    OR (n.title LIKE 'Engineering Productivity%' AND t.name = 'Productivity')
    OR (n.title LIKE 'Modern Web Performance%' AND t.name IN ('Frontend', 'Engineering', 'Performance'))
)
WHERE n.id IN (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000030'
)
ON CONFLICT (note_id, tag_id) DO NOTHING;

-- 4. Seed Journal
INSERT INTO public.journal_entries (date, content, mood, tags, word_count) VALUES
    (CURRENT_DATE, 'Shipped major updates to the portfolio platform today! Refined the UI components and added interactive tutorials.', 'accomplished', ARRAY['Tech', 'Portfolio', 'Release'], 210),
    (CURRENT_DATE - INTERVAL '1 day', 'Deep dive into database architecture and caching strategies. Good progress on performance benchmarks.', 'productive', ARRAY['Learning', 'System Design'], 180),
    (CURRENT_DATE - INTERVAL '2 days', 'Reflected on quarterly milestones and mapped out new goals for upcoming open-source projects.', 'inspired', ARRAY['Reflection', 'Planning'], 150)
ON CONFLICT (date) DO UPDATE SET
    content = EXCLUDED.content,
    mood = EXCLUDED.mood,
    tags = EXCLUDED.tags,
    word_count = EXCLUDED.word_count;

-- 5. Seed Lessons Learned (5 categories, 6 rich lessons with detailed context & takeaways)
INSERT INTO public.lesson_categories (name, color) VALUES
    ('System Architecture', '#6366F1'),
    ('Leadership & Teamwork', '#10B981'),
    ('Product & Prioritization', '#F59E0B'),
    ('Incident Resiliency', '#EF4444'),
    ('Career & Mindset', '#8B5CF6')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;

DELETE FROM public.lessons WHERE title IN (
    'Premature Optimization vs Architecture Scalability',
    'Async Communication Beats Synchronous Status Meetings',
    'The Trap of the "One More Feature" Release Cycle',
    'Blameless Post-Mortems Build Resilient Systems',
    'Technical Debt is a Financial Debt: Plan for Interest Payments',
    'Saying "No" Gracefully is a Senior Engineer''s Primary Superpower'
);

INSERT INTO public.lessons (title, description, takeaways, content, category_id) VALUES
    (
        'Premature Optimization vs Architecture Scalability',
        'Attempted to build a complex multi-region sharding layer before the product had validated real bottleneck requirements. Added 4 months of engineering overhead for negligible throughput gain.',
        'Design for clean modular boundaries first. Keep data storage simple (PostgreSQL) until measured load proves horizontal sharding is required.',
        'Attempted to build a complex multi-region sharding layer before the product had validated real bottleneck requirements. Added 4 months of engineering overhead for negligible throughput gain.',
        (SELECT id FROM public.lesson_categories WHERE name = 'System Architecture' LIMIT 1)
    ),
    (
        'Async Communication Beats Synchronous Status Meetings',
        'Weekly round-robin status calls were draining team momentum without surfacing blockers fast enough. Engineers prepared defensive updates instead of collaborating.',
        'Adopted daily async bullet-point updates with explicit blocker tags. Reserved live meetings strictly for brainstorms and collaborative architecture.',
        'Weekly round-robin status calls were draining team momentum without surfacing blockers fast enough. Engineers prepared defensive updates instead of collaborating.',
        (SELECT id FROM public.lesson_categories WHERE name = 'Leadership & Teamwork' LIMIT 1)
    ),
    (
        'The Trap of the "One More Feature" Release Cycle',
        'Delayed a major client dashboard launch by 6 weeks trying to squeeze in export-to-PDF and dark mode toggles. Early customer feedback on core workflows was needlessly delayed.',
        'Ship the thinnest slice that creates end-to-end customer utility. Real customer validation always disproves half of your anticipated follow-up feature hypotheses.',
        'Delayed a major client dashboard launch by 6 weeks trying to squeeze in export-to-PDF and dark mode toggles. Early customer feedback on core workflows was needlessly delayed.',
        (SELECT id FROM public.lesson_categories WHERE name = 'Product & Prioritization' LIMIT 1)
    ),
    (
        'Blameless Post-Mortems Build Resilient Systems',
        'A critical Redis cache eviction cascading outage caused 45 minutes of API 502 errors. The initial instinct was to question why the deploying engineer missed the connection pool limit.',
        'Focus on systemic safeguards rather than human error. Human mistakes reveal missing guardrails, circuit breakers, and load shedding tests. Added automated canary deployments and synthetic stress tests.',
        'A critical Redis cache eviction cascading outage caused 45 minutes of API 502 errors. The initial instinct was to question why the deploying engineer missed the connection pool limit.',
        (SELECT id FROM public.lesson_categories WHERE name = 'Incident Resiliency' LIMIT 1)
    ),
    (
        'Technical Debt is a Financial Debt: Plan for Interest Payments',
        'Rushed a prototype notification system with hardcoded SQL and tight database couplings. Six months later, adding push notifications took 3x longer than building from scratch.',
        'Every shortcut borrows velocity from future sprints. Log tech-debt tickets immediately, assign estimated interest cost, and reserve 20% of every sprint cycle for refactoring.',
        'Rushed a prototype notification system with hardcoded SQL and tight database couplings. Six months later, adding push notifications took 3x longer than building from scratch.',
        (SELECT id FROM public.lesson_categories WHERE name = 'System Architecture' LIMIT 1)
    ),
    (
        'Saying "No" Gracefully is a Senior Engineer''s Primary Superpower',
        'Said yes to 5 concurrent cross-team initiatives, leading to context-switching fatigue and slipping deadlines across 3 major deliverables.',
        'High-leverage execution requires ruthless focus. Saying no to good ideas is necessary to preserve energy and excellence for the great ones. Offer alternative paths or clear trade-off assessments when declining.',
        'Said yes to 5 concurrent cross-team initiatives, leading to context-switching fatigue and slipping deadlines across 3 major deliverables.',
        (SELECT id FROM public.lesson_categories WHERE name = 'Career & Mindset' LIMIT 1)
    );

-- 6. Seed Movies & Platforms
INSERT INTO public.movies_categories (name, color) VALUES
    ('Sci-Fi', '#8B5CF6'),
    ('Thriller', '#EC4899'),
    ('Drama', '#F59E0B'),
    ('Marvel', '#EC4899'),
    ('kannada', '#F59E0B')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;

INSERT INTO public.movies_platforms (name, icon, enabled, is_default) VALUES
    ('Netflix', 'Tv', true, true),
    ('Prime Video', 'Film', true, false),
    ('Apple TV+', 'Monitor', true, false)
ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;

DELETE FROM public.movies_tv;

INSERT INTO public.movies_tv (
    id, title, release_year, genre, custom_category, imdb_score, rotten_tomatoes_rating, rated, poster_url, plot, watched, created_at, updated_at, actors, imdb_id, directors,
    type, imdb_rating, status, year, director
) VALUES
    ('9209f228-1ffe-46b1-8910-71064c90a41c', 'Chernobyl', '2019', 'Drama, History, Thriller', null, '9.3', 'N/A', 'TV-MA', 'https://m.media-amazon.com/images/M/MV5BNzU0OTI4YTQtNGQ1ZS00ZjA4LTg3MTMtZjkyZWNjN2RiZDJmXkEyXkFqcGc@._V1_SX300.jpg', 'In April 1986, the city of Chernobyl in the Soviet Union suffers one of the worst nuclear disasters in the history of mankind. Consequently, many heroes put their lives on the line in the following days, weeks and months.', true, '2026-02-12 11:54:31.511225+00', '2026-02-12 12:26:07.859872+00', null, NULL, null, 'tv', 9.3, 'watched', 2019, null),
    ('fc4ea6e2-5969-4f91-bdd1-f27a23a6ecc9', 'K.G.F: Chapter 2', '2022', 'Action, Crime, Drama', 'kannada', '8.2', '50%', 'Not Rated', 'https://m.media-amazon.com/images/M/MV5BZmQzZjVkZTUtYjI4ZC00ZDJmLWI0ZDUtZTFmMGM1Mzc5ZjIyXkEyXkFqcGc@._V1_SX300.jpg', 'In the blood-soaked Kolar Gold Fields, Rocky''s name strikes fear into his foes, while the government sees him as a threat to law and order. Rocky must battle threats from all sides for unchallenged supremacy.', false, '2026-02-07 10:37:11.601911+00', '2026-02-07 10:37:11.601911+00', null, NULL, null, 'movie', 8.2, 'watchlist', 2022, null),
    ('07b8bbbe-0040-4239-8ee9-fbb24cfaaa77', 'The Terminal List', '2022–', 'Action, Drama, Thriller', null, '7.9', 'N/A', 'TV-MA', 'https://m.media-amazon.com/images/M/MV5BOTU3NDc5OTYtNjUxNS00MzgxLWI3YjItZmZmNWJkYTNiNGUwXkEyXkFqcGc@._V1_SX300.jpg', 'A former Navy SEAL officer investigates why his entire platoon was ambushed during a high-stakes covert mission.', true, '2026-02-12 11:53:45.705906+00', '2026-03-27 18:12:57.210736+00', null, NULL, null, 'tv', 7.9, 'watched', 2022, null),
    ('fa4ce01c-6a42-47c9-bf7d-9f63ca682da0', 'Money Heist', '2017–2021', 'Action, Crime, Drama', null, '8.2', 'N/A', 'TV-MA', 'https://m.media-amazon.com/images/M/MV5BZjkxZWJiNTUtYjQwYS00MTBlLTgwODQtM2FkNWMyMjMwOGZiXkEyXkFqcGc@._V1_SX300.jpg', 'An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history - stealing 2.4 billion euros from the Royal Mint of Spain.', false, '2026-02-12 11:53:11.132238+00', '2026-02-12 11:53:11.132238+00', null, NULL, null, 'tv', 8.2, 'watchlist', 2017, null),
    ('52d45999-5903-43b8-9595-c20dc04e53f5', 'Demon Slayer: Kimetsu no Yaiba', '2019–2024', 'Animation, Action, Adventure', null, '8.6', 'N/A', 'TV-MA', 'https://m.media-amazon.com/images/M/MV5BMWU1OGEwNmQtNGM3MS00YTYyLThmYmMtN2FjYzQzNzNmNTE0XkEyXkFqcGc@._V1_SX300.jpg', 'A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly. Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.', true, '2026-01-21 14:03:04.991718+00', '2026-02-03 20:21:10.471109+00', 'Natsuki Hanae, Zach Aguilar, Abby Trott', 'tt9335498', 'N/A', 'tv', 8.6, 'watched', 2019, 'N/A'),
    ('79b4f4dd-2f99-4a06-964f-a8ed8d01ebe5', 'Tetris', '2023', 'Biography, Drama, History', null, '7.4', '81%', 'R', 'https://m.media-amazon.com/images/M/MV5BMDZhY2Y4ZGQtODk4MC00NGQwLWFiMWItNzU2M2Q3Nzk2MmVlXkEyXkFqcGc@._V1_SX300.jpg', 'Video game designer Henk Rogers seeks to secure global rights for Tetris (1984), leading to tense negotiations in the Soviet Union, involving creators, government, and corporate intrigues.', true, '2025-09-16 09:29:27.864562+00', '2026-02-03 20:21:10.471109+00', 'Taron Egerton, Mara Huf, Miles Barrow', 'tt12758060', 'Jon S. Baird', 'movie', 7.4, 'watched', 2023, 'Jon S. Baird'),
    ('a20f28d6-ede4-4e4f-9546-a29c2fe2247c', 'Carry-On', '2024', 'Action, Crime, Thriller', null, '6.5', '88%', 'PG-13', 'https://m.media-amazon.com/images/M/MV5BNTNkMjQzNmQtNzE4ZC00NDlmLTkyYjAtZDZkYTQ5NjBmYThlXkEyXkFqcGc@._V1_SX300.jpg', 'A mysterious traveler blackmails a young TSA agent into letting a dangerous package slip through security and onto a Christmas Eve flight.', true, '2025-09-17 05:30:54.127557+00', '2026-02-03 20:21:10.471109+00', 'Taron Egerton, Jason Bateman, Sofia Carson', 'tt21382296', 'Jaume Collet-Serra', 'movie', 6.5, 'watched', 2024, 'Jaume Collet-Serra'),
    ('0317d7e9-fb47-4da6-98ce-1b552f7043d5', 'Oppenheimer', '2023', 'Biography, Drama, History', null, '8.2', '93%', 'R', 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_SX300.jpg', 'A dramatization of the life story of J. Robert Oppenheimer, the physicist who had a large hand in the development of the atomic bombs that brought an end to World War II.', true, '2026-02-03 09:43:15.675966+00', '2026-02-03 20:21:10.471109+00', 'Cillian Murphy, Emily Blunt, Matt Damon', 'tt15398776', 'Christopher Nolan', 'movie', 8.2, 'watched', 2023, 'Christopher Nolan'),
    ('7fce110d-2c51-4f5d-bae1-3f8df8ebd862', 'Breaking Bad', '2008–2013', 'Crime, Drama, Thriller', null, '9.5', '96%', 'TV-MA', 'https://m.media-amazon.com/images/M/MV5BMzU5ZGYzNmQtMTdhYy00OGRiLTg0NmQtYjVjNzliZTg1ZGE4XkEyXkFqcGc@._V1_SX300.jpg', 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student to secure his family''s future.', true, '2025-09-19 08:48:12.341358+00', '2026-02-03 20:21:10.471109+00', 'Bryan Cranston, Aaron Paul, Anna Gunn', 'tt0903747', 'N/A', 'tv', 9.5, 'watched', 2008, 'N/A'),
    ('3783b2dc-e452-44c3-962f-cd150a3761f9', 'Guardians of the Galaxy Vol. 3', '2023', 'Action, Adventure, Comedy', 'Marvel', '7.9', '82%', 'PG-13', 'https://m.media-amazon.com/images/M/MV5BOTJhOTMxMmItZmE0Ny00MDc3LWEzOGEtOGFkMzY4MWYyZDQ0XkEyXkFqcGc@._V1_SX300.jpg', 'Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe and one of their own - a mission that could mean the end of the Guardians if not successful.', true, '2025-09-29 01:09:13.296137+00', '2026-02-03 20:21:10.471109+00', 'Chris Pratt, Chukwudi Iwuji, Bradley Cooper', 'tt6791350', 'James Gunn', 'movie', 7.9, 'watched', 2023, 'James Gunn'),
    ('3f7dd7f3-1e9b-428e-bb31-c7ff9d508f84', 'Interstellar', '2014', 'Adventure, Drama, Sci-Fi', null, '8.7', '73%', 'PG-13', 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX300.jpg', 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.', true, '2025-09-29 01:24:04.278359+00', '2026-02-03 20:21:10.471109+00', 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', 'tt0816692', 'Christopher Nolan', 'movie', 8.7, 'watched', 2014, 'Christopher Nolan'),
    ('2f4672fd-4d56-43c8-b72c-c51c780033df', 'The Avengers', '2012', 'Action, Sci-Fi', 'Marvel', '8.0', '91%', 'PG-13', 'https://m.media-amazon.com/images/M/MV5BNGE0YTVjNzUtNzJjOS00NGNlLTgxMzctZTY4YTE1Y2Y1ZTU4XkEyXkFqcGc@._V1_SX300.jpg', 'Earth''s mightiest heroes must come together and learn to fight as a team if they are going to stop the mischievous Loki and his alien army from enslaving humanity.', true, '2025-09-29 01:30:33.102716+00', '2026-02-03 20:21:10.471109+00', 'Robert Downey Jr., Chris Evans, Scarlett Johansson', 'tt0848228', 'Joss Whedon', 'movie', 8.0, 'watched', 2012, 'Joss Whedon'),
    ('d04269d7-5083-4661-9fb3-9f2d48277068', 'John Wick: Chapter 2', '2017', 'Action, Crime, Thriller', null, '7.4', '89%', 'R', 'https://m.media-amazon.com/images/M/MV5BMjE2NDkxNTY2M15BMl5BanBnXkFtZTgwMDc2NzE0MTI@._V1_SX300.jpg', 'After returning to the criminal underworld to repay a debt, John Wick discovers that a large bounty has been put on his life.', true, '2025-11-28 03:14:42.881513+00', '2026-02-03 20:21:10.471109+00', 'Keanu Reeves, Riccardo Scamarcio, Ian McShane', 'tt4425200', 'Chad Stahelski', 'movie', 7.4, 'watched', 2017, 'Chad Stahelski'),
    ('5c256033-fb0c-4dc3-89cb-628fc4045578', 'Super 30', '2019', 'Biography, Drama', null, '7.9', '31%', 'Not Rated', 'https://m.media-amazon.com/images/M/MV5BNTM0N2I4OTQtYmJlOC00MTUzLTlhZWMtZGIxODkxZTZkMDIyXkEyXkFqcGc@._V1_SX300.jpg', 'Based on the life of Patna-based mathematician Anand Kumar who runs the famed Super 30 program for IIT aspirants in Patna.', true, '2026-01-17 05:37:48.204761+00', '2026-02-03 20:21:10.471109+00', 'Hrithik Roshan, Mrunal Thakur, Nandish Singh Sandhu', 'tt7485048', 'Vikas Bahl', 'movie', 7.9, 'watched', 2019, 'Vikas Bahl'),
    ('b5328363-7d7b-4f27-a7a0-3b6d9eb8ec9c', 'Ford v Ferrari', '2019', 'Action, Biography, Drama', null, '8.1', '92%', 'PG-13', 'https://m.media-amazon.com/images/M/MV5BOTBjNTEyNjYtYjdkNi00YzE5LTljYzUtZjVlYmYwZmJmZWYxXkEyXkFqcGc@._V1_SX300.jpg', 'American car designer Carroll Shelby and driver Ken Miles battle corporate interference and the laws of physics to build a revolutionary race car for Ford in order to defeat Ferrari at the 24 Hours of Le Mans in 1966.', true, '2026-02-03 09:40:34.429401+00', '2026-02-03 20:21:10.471109+00', 'Matt Damon, Christian Bale, Jon Bernthal', 'tt1950186', 'James Mangold', 'movie', 8.1, 'watched', 2019, 'James Mangold'),
    ('a04262d9-58d7-4541-a43c-074588ed9206', 'The Martian', '2015', 'Adventure, Drama, Sci-Fi', null, '8.0', '91%', 'PG-13', 'https://m.media-amazon.com/images/M/MV5BMTc2MTQ3MDA1Nl5BMl5BanBnXkFtZTgwODA3OTI4NjE@._V1_SX300.jpg', 'An astronaut becomes stranded on Mars after his team assumes him dead, and must rely on his ingenuity to find a way to signal to Earth that he is alive and can survive until a potential rescue.', true, '2026-02-03 10:00:28.193536+00', '2026-02-03 20:21:10.471109+00', 'Matt Damon, Jessica Chastain, Kristen Wiig', 'tt3659388', 'Ridley Scott', 'movie', 8.0, 'watched', 2015, 'Ridley Scott'),
    ('f95a4e20-a59f-47cf-87d6-310f4d375a36', 'Game of Thrones', '2011–2019', 'Action, Adventure, Drama', null, '9.2', 'N/A', 'TV-MA', 'https://m.media-amazon.com/images/M/MV5BMTNhMDJmNmYtNDQ5OS00ODdlLWE0ZDAtZTgyYTIwNDY3OTU3XkEyXkFqcGc@._V1_SX300.jpg', 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.', true, '2026-02-12 11:54:40.161726+00', '2026-02-12 12:25:51.61001+00', null, NULL, null, 'tv', 9.2, 'watched', 2011, null),
    ('29f52d53-f0d4-464b-9dfa-ada084c3b361', 'Uri: The Surgical Strike', '2019', 'Action, Drama, History', null, '8.2', '57%', 'Not Rated', 'https://m.media-amazon.com/images/M/MV5BYTgyMTlkZTgtMTMxYi00Mjk5LTg2NTMtNGYyMDVlZWM0NmZjXkEyXkFqcGc@._V1_SX300.jpg', 'Indian army special forces execute a covert operation, avenging the killing of fellow army soldiers at their base by a terrorist group.', true, '2026-02-12 11:53:30.93856+00', '2026-02-12 11:53:30.93856+00', null, NULL, null, 'movie', 8.2, 'watched', 2019, null)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    release_year = EXCLUDED.release_year,
    genre = EXCLUDED.genre,
    custom_category = EXCLUDED.custom_category,
    imdb_score = EXCLUDED.imdb_score,
    rotten_tomatoes_rating = EXCLUDED.rotten_tomatoes_rating,
    rated = EXCLUDED.rated,
    poster_url = EXCLUDED.poster_url,
    plot = EXCLUDED.plot,
    watched = EXCLUDED.watched,
    actors = EXCLUDED.actors,
    imdb_id = EXCLUDED.imdb_id,
    directors = EXCLUDED.directors;

-- 7. Seed Revision & Spaced Repetition (5 categories, 7 diverse technical topics)
INSERT INTO public.revision_category (name, color) VALUES
    ('System Design', '#8B5CF6'),
    ('Databases & Storage', '#3B82F6'),
    ('Frontend Architecture', '#10B981'),
    ('Networking & Security', '#F59E0B'),
    ('Algorithms & Concurrency', '#EC4899')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;

DELETE FROM public.revision_element WHERE title IN (
    'Consistent Hashing & Virtual Nodes',
    'Database Isolation Levels: Phantom vs Non-Repeatable Reads',
    'React Fiber Reconciler & Concurrent Rendering',
    'Raft Consensus: Leader Election & Log Replication',
    'LSM Trees vs B+ Trees: Write vs Read Amplification',
    'TLS 1.3 0-RTT & TCP Connection Termination',
    'Actor Model vs CSP (Communicating Sequential Processes)',
    'Raft Consensus Protocol: Leader Election & Log Replication',
    'Postgres VACUUM & MVCC Architecture',
    'WebSockets vs Server-Sent Events (SSE) vs HTTP/2 Long Polling',
    'Cache Invalidation Strategies: Write-Through vs Write-Back'
) OR name IN (
    'Consistent Hashing & Virtual Nodes',
    'Database Isolation Levels: Phantom vs Non-Repeatable Reads',
    'React Fiber Reconciler & Concurrent Rendering',
    'Raft Consensus: Leader Election & Log Replication',
    'LSM Trees vs B+ Trees: Write vs Read Amplification',
    'TLS 1.3 0-RTT & TCP Connection Termination',
    'Actor Model vs CSP (Communicating Sequential Processes)',
    'Raft Consensus Protocol: Leader Election & Log Replication',
    'Postgres VACUUM & MVCC Architecture',
    'WebSockets vs Server-Sent Events (SSE) vs HTTP/2 Long Polling',
    'Cache Invalidation Strategies: Write-Through vs Write-Back'
);

INSERT INTO public.revision_element (title, name, content, category_id, difficulty, review_count, count, interval_days, next_review_date)
VALUES (
    'Consistent Hashing & Virtual Nodes',
    'Consistent Hashing & Virtual Nodes',
    'Consistent hashing maps both keys and nodes to a circular hash ring (0 to 2^32-1). Virtual nodes (vnodes) assign multiple points per physical server to ensure uniform key distribution and minimize hotspotting when nodes join or fail.',
    (SELECT id FROM public.revision_category WHERE name = 'System Design' LIMIT 1),
    'easy', 4, 4, 7, NOW() + INTERVAL '3 days'
);

INSERT INTO public.revision_element (title, name, content, category_id, difficulty, review_count, count, interval_days, next_review_date)
VALUES (
    'Database Isolation Levels: Phantom vs Non-Repeatable Reads',
    'Database Isolation Levels: Phantom vs Non-Repeatable Reads',
    'Non-repeatable read occurs when row data changes between reads within a transaction. Phantom read occurs when the set of rows matching a WHERE clause changes (due to INSERT/DELETE by another transaction). Serializable isolation prevents both using predicate locks or snapshot isolation.',
    (SELECT id FROM public.revision_category WHERE name = 'Databases & Storage' LIMIT 1),
    'medium', 2, 2, 3, NOW() + INTERVAL '1 day'
);

INSERT INTO public.revision_element (title, name, content, category_id, difficulty, review_count, count, interval_days, next_review_date)
VALUES (
    'React Fiber Reconciler & Concurrent Rendering',
    'React Fiber Reconciler & Concurrent Rendering',
    'React Fiber decomposes reconciliation into fine-grained units of work (fibers). It decouples the work phase (interruptible, priority-based lanes) from the commit phase (synchronous DOM mutations), enabling features like useTransition and selective hydration.',
    (SELECT id FROM public.revision_category WHERE name = 'Frontend Architecture' LIMIT 1),
    'hard', 3, 3, 4, NOW() + INTERVAL '2 days'
);

INSERT INTO public.revision_element (title, name, content, category_id, difficulty, review_count, count, interval_days, next_review_date)
VALUES (
    'Raft Consensus: Leader Election & Log Replication',
    'Raft Consensus: Leader Election & Log Replication',
    'Raft decomposes consensus into 3 subproblems: Leader Election (randomized election timers between 150-300ms to avoid split votes), Log Replication (leader appends entries and commits upon quorum ACK), and Safety (leader completeness guarantees committed entries are never overridden).',
    (SELECT id FROM public.revision_category WHERE name = 'System Design' LIMIT 1),
    'hard', 1, 1, 2, NOW() + INTERVAL '1 day'
);

INSERT INTO public.revision_element (title, name, content, category_id, difficulty, review_count, count, interval_days, next_review_date)
VALUES (
    'LSM Trees vs B+ Trees: Write vs Read Amplification',
    'LSM Trees vs B+ Trees: Write vs Read Amplification',
    'LSM Trees (RocksDB, Cassandra) optimize for sequential write throughput via append-only MemTable and SSTables, trading read performance (compaction, bloom filters). B+ Trees (PostgreSQL, InnoDB) optimize for fast reads with fixed-size pages and in-place updates, paying higher write amplification.',
    (SELECT id FROM public.revision_category WHERE name = 'Databases & Storage' LIMIT 1),
    'medium', 3, 3, 6, NOW() + INTERVAL '5 days'
);

INSERT INTO public.revision_element (title, name, content, category_id, difficulty, review_count, count, interval_days, next_review_date)
VALUES (
    'TLS 1.3 0-RTT & TCP Connection Termination',
    'TLS 1.3 0-RTT & TCP Connection Termination',
    'TLS 1.3 reduces the handshake to 1 round-trip (1-RTT) by combining crypto parameter negotiation with key exchange. Pre-shared keys enable 0-RTT resumption (with replay attack trade-offs). TCP closes gracefully with a 4-way FIN/ACK handshake and TIME_WAIT (2*MSL) to drain lingering segments.',
    (SELECT id FROM public.revision_category WHERE name = 'Networking & Security' LIMIT 1),
    'medium', 2, 2, 5, NOW() + INTERVAL '4 days'
);

INSERT INTO public.revision_element (title, name, content, category_id, difficulty, review_count, count, interval_days, next_review_date)
VALUES (
    'Actor Model vs CSP (Communicating Sequential Processes)',
    'Actor Model vs CSP (Communicating Sequential Processes)',
    'Actor Model (Erlang, Akka) communicates via mailbox-addressed asynchronous messages with dynamic topology. CSP (Go channels) communicates via first-class rendezvous channels where sender and receiver synchronize over the channel itself without direct actor knowledge.',
    (SELECT id FROM public.revision_category WHERE name = 'Algorithms & Concurrency' LIMIT 1),
    'hard', 2, 2, 3, NOW() + INTERVAL '1 day'
);

-- Point category current elements
UPDATE public.revision_category rc
SET curr_element_id = (
    SELECT re.id FROM public.revision_element re 
    WHERE re.category_id = rc.id 
    ORDER BY re.created_at ASC LIMIT 1
);

-- 8. Seed Finance Schema (8 Core Asset Types, Platforms, Investments, Transactions, Valuations & SIPs)
INSERT INTO finance.asset_types (name, color, category, description) VALUES
    ('Mutual Funds & Index Funds', '#3B82F6', 'Equity', 'Diversified equity funds & index trackers'),
    ('Direct Equity & ETFs', '#10B981', 'Equity', 'Individual stocks & thematic baskets'),
    ('Fixed Deposits & Bonds', '#6366F1', 'Debt', 'Capital protection fixed-yield instruments'),
    ('EPF & Provident Funds', '#8B5CF6', 'Retirement', 'Compulsory retirement provident fund'),
    ('Gold & Commodities', '#F59E0B', 'Commodity', 'Sovereign gold bonds & precious metals'),
    ('Crypto & Digital Assets', '#EC4899', 'Crypto', 'Decentralized protocol tokens & staking'),
    ('REITs & Real Estate', '#14B8A6', 'Real Estate', 'Commercial office & warehouse REITs'),
    ('Liquid Cash & Savings', '#06B6D4', 'Cash', 'Emergency reserve in high-yield account')
ON CONFLICT (name) DO UPDATE SET
    color = EXCLUDED.color,
    category = EXCLUDED.category,
    description = EXCLUDED.description;

INSERT INTO finance.investment_platforms (name, type, url) VALUES
    ('Zerodha (Coin/Kite)', 'Broker', 'https://kite.zerodha.com'),
    ('Groww', 'Broker', 'https://groww.in'),
    ('HDFC Bank', 'Bank', 'https://hdfcbank.com'),
    ('EPFO India', 'Retirement', 'https://epfindia.gov.in'),
    ('Binance / Vault', 'Exchange', 'https://binance.com')
ON CONFLICT (name) DO UPDATE SET
    type = EXCLUDED.type,
    url = EXCLUDED.url;

-- Clean existing sample finance investments (and cascade to tx, val, sip)
DELETE FROM finance.investments WHERE name IN (
    'UTI Nifty 50 Index Fund Direct Growth',
    'Parag Parikh Flexi Cap Fund',
    'Midcap High-Beta Momentum Basket',
    'Clean Energy & Solar Thematic ETF',
    'HDFC Bank Fixed Deposit (7.25% p.a.)',
    'Employee Provident Fund (EPF)',
    'Sovereign Gold Bond 2023 Series III',
    'Ethereum (ETH) Staking Vault',
    'Brookfield India Real Estate Trust (REIT)',
    'Emergency Cash Reserve (High-Yield Savings)'
);

INSERT INTO finance.investments (name, asset_type_id, platform_id, notes, extra_configuration) VALUES
    ('UTI Nifty 50 Index Fund Direct Growth', (SELECT id FROM finance.asset_types WHERE name = 'Mutual Funds & Index Funds' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'Zerodha (Coin/Kite)' LIMIT 1), 'Core long-term index allocation (Nifty 50)', '{"mf_scheme_code":"120716"}'::jsonb),
    ('Parag Parikh Flexi Cap Fund', (SELECT id FROM finance.asset_types WHERE name = 'Mutual Funds & Index Funds' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'Groww' LIMIT 1), 'Active diversified equity with global exposure', '{"mf_scheme_code":"122639"}'::jsonb),
    ('Midcap High-Beta Momentum Basket', (SELECT id FROM finance.asset_types WHERE name = 'Direct Equity & ETFs' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'Zerodha (Coin/Kite)' LIMIT 1), 'Smallcase thematic basket (underperforming post-correction)', NULL),
    ('Clean Energy & Solar Thematic ETF', (SELECT id FROM finance.asset_types WHERE name = 'Direct Equity & ETFs' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'Zerodha (Coin/Kite)' LIMIT 1), 'Clean energy transition ETF (cyclical headwind)', NULL),
    ('HDFC Bank Fixed Deposit (7.25% p.a.)', (SELECT id FROM finance.asset_types WHERE name = 'Fixed Deposits & Bonds' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'HDFC Bank' LIMIT 1), '18-month senior term deposit', NULL),
    ('Employee Provident Fund (EPF)', (SELECT id FROM finance.asset_types WHERE name = 'EPF & Provident Funds' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'EPFO India' LIMIT 1), 'Statutory retirement contribution (8.25% interest rate)', NULL),
    ('Sovereign Gold Bond 2023 Series III', (SELECT id FROM finance.asset_types WHERE name = 'Gold & Commodities' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'Zerodha (Coin/Kite)' LIMIT 1), 'RBI SGB yielding 2.5% semi-annual coupon + capital appreciation', NULL),
    ('Ethereum (ETH) Staking Vault', (SELECT id FROM finance.asset_types WHERE name = 'Crypto & Digital Assets' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'Binance / Vault' LIMIT 1), 'Lido staked ETH (bought during mid-cycle top)', '{"coin_id":"ethereum"}'::jsonb),
    ('Brookfield India Real Estate Trust (REIT)', (SELECT id FROM finance.asset_types WHERE name = 'REITs & Real Estate' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'Groww' LIMIT 1), 'Grade-A office parks commercial REIT with quarterly distribution', NULL),
    ('Emergency Cash Reserve (High-Yield Savings)', (SELECT id FROM finance.asset_types WHERE name = 'Liquid Cash & Savings' LIMIT 1), (SELECT id FROM finance.investment_platforms WHERE name = 'HDFC Bank' LIMIT 1), '6-month liquidity buffer', NULL);

-- Seed transactions (invested principal & ongoing monthly SIP capital)
INSERT INTO finance.investment_transactions (investment_id, transaction_type, transaction_date, amount_invested, total_amount, tenure_months, interest_rate, maturity_date) VALUES
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), 'buy, CURRENT_DATE - 180, 90000, 90000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), 'buy, CURRENT_DATE - 150, 15000, 15000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), 'buy, CURRENT_DATE - 120, 15000, 15000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), 'buy, CURRENT_DATE - 90, 15000, 15000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), 'buy, CURRENT_DATE - 30, 15000, 15000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), 'buy, CURRENT_DATE - 180, 80000, 80000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), 'buy, CURRENT_DATE - 150, 10000, 10000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), 'buy, CURRENT_DATE - 120, 10000, 10000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), 'buy, CURRENT_DATE - 90, 10000, 10000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), 'buy, CURRENT_DATE - 30, 10000, 10000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), 'buy, CURRENT_DATE - 180, 40000, 40000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), 'buy, CURRENT_DATE - 120, 20000, 20000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), 'buy, CURRENT_DATE - 180, 50000, 50000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), 'buy, CURRENT_DATE - 90, 30000, 30000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), 'buy, CURRENT_DATE - 180, 100000, 100000, 18, 7.25, CURRENT_DATE + 365),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), 'buy, CURRENT_DATE - 180, 200000, 200000, NULL, 8.25, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), 'buy, CURRENT_DATE - 150, 8000, 8000, NULL, 8.25, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), 'buy, CURRENT_DATE - 120, 8000, 8000, NULL, 8.25, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), 'buy, CURRENT_DATE - 90, 8000, 8000, NULL, 8.25, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), 'buy, CURRENT_DATE - 60, 8000, 8000, NULL, 8.25, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), 'buy, CURRENT_DATE - 30, 8000, 8000, NULL, 8.25, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), 'buy, CURRENT_DATE - 180, 65000, 65000, 96, 2.50, CURRENT_DATE + 2700),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), 'buy, CURRENT_DATE - 180, 70000, 70000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), 'buy, CURRENT_DATE - 120, 40000, 40000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), 'buy, CURRENT_DATE - 180, 75000, 75000, NULL, NULL, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), 'buy, CURRENT_DATE - 180, 130000, 130000, NULL, 3.50, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), 'buy, CURRENT_DATE - 150, 5000, 5000, NULL, 3.50, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), 'buy, CURRENT_DATE - 120, 5000, 5000, NULL, 3.50, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), 'buy, CURRENT_DATE - 90, 5000, 5000, NULL, 3.50, NULL),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), 'buy, CURRENT_DATE - 30, 5000, 5000, NULL, 3.50, NULL);

-- Seed multi-point valuations: Historical 6-month trajectories across all asset types (~18% overall return)
INSERT INTO finance.investment_valuations (investment_id, valuation_date, current_value) VALUES
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE - 180, 168000),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE - 150, 174000),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE - 120, 183500),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE - 90, 181000),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE - 60, 194000),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE - 45, 202000),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE - 30, 208500),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE - 15, 212000),
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), CURRENT_DATE, 215000),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE - 180, 134000),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE - 150, 141000),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE - 120, 148500),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE - 90, 146000),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE - 60, 157000),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE - 45, 163500),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE - 30, 169000),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE - 15, 172000),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), CURRENT_DATE, 174500),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE - 180, 48000),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE - 150, 55000),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE - 120, 64000),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE - 90, 59000),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE - 60, 56500),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE - 45, 58000),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE - 30, 60200),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE - 15, 61100),
    ((SELECT id FROM finance.investments WHERE name = 'Midcap High-Beta Momentum Basket' LIMIT 1), CURRENT_DATE, 61800),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE - 180, 78000),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE - 150, 75000),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE - 120, 72000),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE - 90, 68500),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE - 60, 66000),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE - 45, 67500),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE - 30, 69000),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE - 15, 69800),
    ((SELECT id FROM finance.investments WHERE name = 'Clean Energy & Solar Thematic ETF' LIMIT 1), CURRENT_DATE, 70400),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE - 180, 101200),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE - 150, 102400),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE - 120, 103600),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE - 90, 104800),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE - 60, 105700),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE - 45, 106200),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE - 30, 106700),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE - 15, 107000),
    ((SELECT id FROM finance.investments WHERE name = 'HDFC Bank Fixed Deposit (7.25% p.a.)' LIMIT 1), CURRENT_DATE, 107250),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE - 180, 246000),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE - 150, 250500),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE - 120, 255000),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE - 90, 259500),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE - 60, 264000),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE - 45, 266500),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE - 30, 268800),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE - 15, 270000),
    ((SELECT id FROM finance.investments WHERE name = 'Employee Provident Fund (EPF)' LIMIT 1), CURRENT_DATE, 271200),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE - 180, 74000),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE - 150, 77500),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE - 120, 81000),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE - 90, 84500),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE - 60, 88000),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE - 45, 90200),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE - 30, 92400),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE - 15, 93500),
    ((SELECT id FROM finance.investments WHERE name = 'Sovereign Gold Bond 2023 Series III' LIMIT 1), CURRENT_DATE, 94250),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE - 180, 95000),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE - 150, 112000),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE - 120, 128000),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE - 90, 105000),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE - 60, 111000),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE - 45, 117000),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE - 30, 121500),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE - 15, 123000),
    ((SELECT id FROM finance.investments WHERE name = 'Ethereum (ETH) Staking Vault' LIMIT 1), CURRENT_DATE, 124300),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE - 180, 76500),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE - 150, 77800),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE - 120, 79000),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE - 90, 80200),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE - 60, 81500),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE - 45, 82200),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE - 30, 82900),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE - 15, 83400),
    ((SELECT id FROM finance.investments WHERE name = 'Brookfield India Real Estate Trust (REIT)' LIMIT 1), CURRENT_DATE, 83800),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE - 180, 150800),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE - 150, 151500),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE - 120, 152200),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE - 90, 153000),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE - 60, 153800),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE - 45, 154200),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE - 30, 154500),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE - 15, 154800),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), CURRENT_DATE, 155000);

-- Seed SIP configurations
INSERT INTO finance.sip_configs (investment_id, name, amount, sip_day, execution_day, is_active, frequency, status, start_date) VALUES
    ((SELECT id FROM finance.investments WHERE name = 'UTI Nifty 50 Index Fund Direct Growth' LIMIT 1), 'UTI Nifty 50 Monthly SIP', 15000, 5, 5, true, 'monthly', 'active', CURRENT_DATE - 365),
    ((SELECT id FROM finance.investments WHERE name = 'Parag Parikh Flexi Cap Fund' LIMIT 1), 'PPFCF Monthly SIP', 10000, 10, 10, true, 'monthly', 'active', CURRENT_DATE - 300),
    ((SELECT id FROM finance.investments WHERE name = 'Emergency Cash Reserve (High-Yield Savings)' LIMIT 1), 'Emergency Cash Monthly Allocation', 5000, 1, 1, true, 'monthly', 'active', CURRENT_DATE - 400);

-- Compatibility public SIP records
DELETE FROM public.sip_investments WHERE name IN (
    'UTI Nifty 50 Index Fund Direct Growth',
    'Parag Parikh Flexi Cap Fund',
    'Emergency Cash Reserve'
);

INSERT INTO public.sip_investments (name, amount, category, debit_date, expected_return_rate) VALUES
    ('UTI Nifty 50 Index Fund Direct Growth', 15000, 'Index Fund', 5, 12.5),
    ('Parag Parikh Flexi Cap Fund', 10000, 'Equity Flexi Cap', 10, 14.0),
    ('Emergency Cash Reserve', 5000, 'Cash / Liquid', 1, 4.0);

-- 9. Seed Job Tracker
INSERT INTO public.ats_platforms (name, url, is_default) VALUES
    ('ChatGPT', 'https://chatgpt.com', true),
    ('Jobscan', 'https://jobscan.co', false),
    ('Resume Worded', 'https://resumeworded.com', false),
    ('Teal', 'https://tealhq.com', false)
ON CONFLICT (name) DO UPDATE SET url = EXCLUDED.url;

INSERT INTO public.job_platforms (name, url, is_active) VALUES
    ('LinkedIn', 'https://linkedin.com/jobs', true),
    ('Wellfound (AngelList)', 'https://wellfound.com/jobs', true),
    ('Ashby', 'https://ashbyhq.com', true),
    ('Indeed', 'https://indeed.com', true)
ON CONFLICT (name) DO UPDATE SET url = EXCLUDED.url;

DELETE FROM public.job_application_ats_scores WHERE job_id IN (
    SELECT id FROM public.job_applications WHERE company_name IN ('Stripe', 'Vercel', 'Figma', 'Canva')
) OR application_id IN (
    SELECT id FROM public.job_applications WHERE company_name IN ('Stripe', 'Vercel', 'Figma', 'Canva')
);
DELETE FROM public.job_applications WHERE company_name IN ('Stripe', 'Vercel', 'Figma', 'Canva');
DELETE FROM public.job_applications_status WHERE id IN (
    '00000000-0000-0000-0000-0000000000a1'::uuid,
    '00000000-0000-0000-0000-0000000000a2'::uuid,
    '00000000-0000-0000-0000-0000000000a3'::uuid,
    '00000000-0000-0000-0000-0000000000a4'::uuid
);

INSERT INTO public.job_applications_status (id, status, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-0000000000a1'::uuid, 'interviewing', now() - interval '12 days', now() - interval '3 days'),
    ('00000000-0000-0000-0000-0000000000a2'::uuid, 'applied', now() - interval '4 days', now() - interval '4 days'),
    ('00000000-0000-0000-0000-0000000000a3'::uuid, 'accepted', now() - interval '28 days', now() - interval '7 days'),
    ('00000000-0000-0000-0000-0000000000a4'::uuid, 'negotiating', now() - interval '18 days', now() - interval '2 days')
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO public.job_applications (
    status_id, company_name, role_name, job_type, city, country, visa_sponsorship,
    salary_min_inr, salary_max_inr, salary_currency, application_link,
    chatgpt_thread_link, applied_date, ats_score, follow_ups, notes, platform, platform_id,
    created_at, updated_at
)
VALUES
    (
        '00000000-0000-0000-0000-0000000000a1'::uuid,
        'Stripe',
        'Senior Full Stack Engineer (Core Infra)',
        'Remote',
        'Bengaluru',
        'India',
        'maybe yes',
        4200000,
        5200000,
        'INR',
        'https://stripe.com/jobs',
        'https://chatgpt.com/c/670e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
        CURRENT_DATE - 12,
        88,
        '[{"id":"fu_1","date":"2026-09-08","type":"Email","notes":"Recruiter screen completed. Advanced to Technical Deep Dive round."},{"id":"fu_2","date":"2026-09-11","type":"Phone Call","notes":"Reviewed System Architecture expectations with hiring manager."}]'::jsonb,
        'Tailored resume with emphasis on distributed ledger and payments transaction reliability.',
        'LinkedIn',
        (SELECT id FROM public.job_platforms WHERE name = 'LinkedIn' LIMIT 1),
        now() - interval '12 days',
        now() - interval '3 days'
    ),
    (
        '00000000-0000-0000-0000-0000000000a2'::uuid,
        'Vercel',
        'Staff Frontend Engineer (Developer Experience)',
        'Remote',
        'San Francisco',
        'United States',
        'yes',
        5000000,
        6500000,
        'INR',
        'https://vercel.com/careers',
        'https://chatgpt.com/c/671f2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
        CURRENT_DATE - 4,
        92,
        '[{"id":"fu_3","date":"2026-09-10","type":"LinkedIn","notes":"Sent connection request and personalized note to the VP of Engineering."}]'::jsonb,
        'Highlighted React performance optimization, next.js server components, and bundle analysis.',
        'Ashby',
        (SELECT id FROM public.job_platforms WHERE name = 'Ashby' LIMIT 1),
        now() - interval '4 days',
        now() - interval '4 days'
    ),
    (
        '00000000-0000-0000-0000-0000000000a3'::uuid,
        'Figma',
        'Lead Platform Engineer',
        'Hybrid',
        'London',
        'United Kingdom',
        'no',
        6000000,
        7500000,
        'INR',
        'https://figma.com/careers',
        NULL,
        CURRENT_DATE - 28,
        85,
        '[{"id":"fu_4","date":"2026-09-05","type":"Email","notes":"Offer letter received! Reviewing compensation package and equity grants."}]'::jsonb,
        'Strong alignment with real-time multiplayer WebAssembly and CRDT synchronization.',
        'Wellfound (AngelList)',
        (SELECT id FROM public.job_platforms WHERE name = 'Wellfound (AngelList)' LIMIT 1),
        now() - interval '28 days',
        now() - interval '7 days'
    ),
    (
        '00000000-0000-0000-0000-0000000000a4'::uuid,
        'Canva',
        'Senior Frontend Infrastructure Engineer',
        'Hybrid',
        'Sydney',
        'Australia',
        'maybe no',
        5500000,
        6800000,
        'INR',
        'https://canva.com/careers',
        NULL,
        CURRENT_DATE - 18,
        87,
        '[{"id":"fu_5","date":"2026-09-08","type":"Email","notes":"Final interview passed. Discussing visa limitations and relocation requirements."}]'::jsonb,
        'Focused on large-scale web canvas rendering and asset pipeline optimization.',
        'LinkedIn',
        (SELECT id FROM public.job_platforms WHERE name = 'LinkedIn' LIMIT 1),
        now() - interval '18 days',
        now() - interval '2 days'
    );

INSERT INTO public.job_application_ats_scores (job_id, application_id, platform_id, platform_name, score) VALUES
    ((SELECT id FROM public.job_applications WHERE company_name = 'Stripe' LIMIT 1), (SELECT id FROM public.job_applications WHERE company_name = 'Stripe' LIMIT 1), (SELECT id FROM public.ats_platforms WHERE name = 'ChatGPT' LIMIT 1), 'ChatGPT', 90),
    ((SELECT id FROM public.job_applications WHERE company_name = 'Stripe' LIMIT 1), (SELECT id FROM public.job_applications WHERE company_name = 'Stripe' LIMIT 1), (SELECT id FROM public.ats_platforms WHERE name = 'Jobscan' LIMIT 1), 'Jobscan', 86),
    ((SELECT id FROM public.job_applications WHERE company_name = 'Vercel' LIMIT 1), (SELECT id FROM public.job_applications WHERE company_name = 'Vercel' LIMIT 1), (SELECT id FROM public.ats_platforms WHERE name = 'ChatGPT' LIMIT 1), 'ChatGPT', 94),
    ((SELECT id FROM public.job_applications WHERE company_name = 'Vercel' LIMIT 1), (SELECT id FROM public.job_applications WHERE company_name = 'Vercel' LIMIT 1), (SELECT id FROM public.ats_platforms WHERE name = 'Jobscan' LIMIT 1), 'Jobscan', 90),
    ((SELECT id FROM public.job_applications WHERE company_name = 'Figma' LIMIT 1), (SELECT id FROM public.job_applications WHERE company_name = 'Figma' LIMIT 1), (SELECT id FROM public.ats_platforms WHERE name = 'ChatGPT' LIMIT 1), 'ChatGPT', 88),
    ((SELECT id FROM public.job_applications WHERE company_name = 'Figma' LIMIT 1), (SELECT id FROM public.job_applications WHERE company_name = 'Figma' LIMIT 1), (SELECT id FROM public.ats_platforms WHERE name = 'Resume Worded' LIMIT 1), 'Resume Worded', 82),
    ((SELECT id FROM public.job_applications WHERE company_name = 'Canva' LIMIT 1), (SELECT id FROM public.job_applications WHERE company_name = 'Canva' LIMIT 1), (SELECT id FROM public.ats_platforms WHERE name = 'ChatGPT' LIMIT 1), 'ChatGPT', 89);

DELETE FROM public.saved_job_links WHERE company_name IN ('Datadog', 'Linear');

INSERT INTO public.saved_job_links (company_name, role_name, url, source, status, salary, location) VALUES
    ('Datadog', 'Senior Distributed Systems Engineer', 'https://datadoghq.com/careers', 'LinkedIn', 'to_apply', '45 - 55 LPA', 'Remote, India'),
    ('Linear', 'Full Stack Product Engineer', 'https://linear.app/careers', 'Wellfound (AngelList)', 'researching', '50 - 65 LPA', 'Remote Worldwide');

-- Success confirmation
SELECT 'Guest database setup and sample data seed completed successfully!' as status;
