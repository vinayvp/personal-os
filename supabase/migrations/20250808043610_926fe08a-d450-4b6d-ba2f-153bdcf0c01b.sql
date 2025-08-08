-- Add tags support to todos table
ALTER TABLE public.todos 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for better performance on tag filtering
CREATE INDEX idx_todos_tags ON public.todos USING GIN(tags);