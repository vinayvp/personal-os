-- Phase 3: Fix function search path and create authentication tables

-- Fix the function search path issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Create app passwords table for secure password storage
CREATE TABLE public.app_passwords (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_passwords (only system can access)
ALTER TABLE public.app_passwords ENABLE ROW LEVEL SECURITY;

-- Create trigger for app_passwords updated_at
CREATE TRIGGER update_app_passwords_updated_at
BEFORE UPDATE ON public.app_passwords
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create session management table
CREATE TABLE public.app_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_sessions
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

-- Create login attempts table for brute force protection
CREATE TABLE public.login_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    success BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempt_time);
CREATE INDEX idx_app_sessions_token ON public.app_sessions(session_token);
CREATE INDEX idx_app_sessions_expires ON public.app_sessions(expires_at);

-- Add update trigger for notes
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();