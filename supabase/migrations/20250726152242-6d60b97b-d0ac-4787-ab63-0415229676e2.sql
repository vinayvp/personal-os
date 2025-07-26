-- Phase 4: Create policies for authentication tables (system access only)

-- No policies needed for app_passwords, app_sessions, login_attempts 
-- These are system tables that should only be accessed by edge functions
-- RLS is enabled to prevent any external access