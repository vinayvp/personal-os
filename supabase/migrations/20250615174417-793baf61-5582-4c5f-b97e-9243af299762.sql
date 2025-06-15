
-- Create a table to store contact form messages
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for the new table
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to submit a message through the contact form.
-- Reading the messages will only be possible directly from the Supabase dashboard for security.
CREATE POLICY "Allow public insert for contact form"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);
