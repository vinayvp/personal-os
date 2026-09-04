-- ==========================================
-- Migration: Add is_pinned to Notes Table
-- Date: 2026-09-04
-- ==========================================

-- 1. Add is_pinned column with default false
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 2. Create index for fast sorting by pinned status
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON public.notes(is_pinned DESC);

