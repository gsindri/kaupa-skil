-- Add Outlook OAuth token fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS outlook_access_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS outlook_authorized BOOLEAN DEFAULT FALSE;