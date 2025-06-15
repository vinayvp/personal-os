
-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT,
  markdown_content TEXT,
  folder TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create note_tags junction table for many-to-many relationship
CREATE TABLE public.note_tags (
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Create note_images table for image attachments
CREATE TABLE public.note_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_name TEXT,
  image_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes" 
  ON public.notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
  ON public.notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
  ON public.notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
  ON public.notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for tags (users can see all tags but only create their own)
CREATE POLICY "Users can view all tags" 
  ON public.tags 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tags" 
  ON public.tags 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for note_tags
CREATE POLICY "Users can view note_tags for their notes" 
  ON public.note_tags 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can create note_tags for their notes" 
  ON public.note_tags 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete note_tags for their notes" 
  ON public.note_tags 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

-- RLS Policies for note_images
CREATE POLICY "Users can view images for their notes" 
  ON public.note_images 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_images.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can create images for their notes" 
  ON public.note_images 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_images.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete images for their notes" 
  ON public.note_images 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_images.note_id 
    AND notes.user_id = auth.uid()
  ));

-- Create storage bucket for note images
INSERT INTO storage.buckets (id, name, public) VALUES ('note-images', 'note-images', true);

-- Create storage policy for note images
CREATE POLICY "Users can upload note images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'note-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view note images" ON storage.objects
  FOR SELECT USING (bucket_id = 'note-images');

CREATE POLICY "Users can delete their note images" ON storage.objects
  FOR DELETE USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX idx_notes_title_content ON public.notes USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));
CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX idx_note_images_note_id ON public.note_images(note_id);
