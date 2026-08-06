CREATE TABLE public.revision_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  count integer NOT NULL DEFAULT 0,
  curr_element_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.revision_element (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.revision_category(id) ON DELETE CASCADE,
  name text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.revision_category
  ADD CONSTRAINT revision_category_curr_element_id_fkey
  FOREIGN KEY (curr_element_id) REFERENCES public.revision_element(id) ON DELETE SET NULL;

CREATE INDEX idx_revision_element_category ON public.revision_element(category_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revision_category TO anon, authenticated;
GRANT ALL ON public.revision_category TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revision_element TO anon, authenticated;
GRANT ALL ON public.revision_element TO service_role;

ALTER TABLE public.revision_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_element ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage revision categories" ON public.revision_category FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage revision elements" ON public.revision_element FOR ALL USING (true) WITH CHECK (true);