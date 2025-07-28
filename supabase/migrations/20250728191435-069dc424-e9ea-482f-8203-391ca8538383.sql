-- Enable RLS on notes-related tables
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notes (open access since no user authentication in original design)
CREATE POLICY "Anyone can manage notes" 
ON public.notes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for note_images (open access for image uploads)
CREATE POLICY "Anyone can manage note images" 
ON public.note_images 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for note_tags (open access for tag management)
CREATE POLICY "Anyone can manage note tags" 
ON public.note_tags 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create storage policies for note-images bucket (if not already exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for note images
CREATE POLICY "Anyone can view note images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'note-images');

CREATE POLICY "Anyone can upload note images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'note-images');

CREATE POLICY "Anyone can update note images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'note-images');

CREATE POLICY "Anyone can delete note images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'note-images');