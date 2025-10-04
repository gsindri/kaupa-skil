-- Add Gmail OAuth token columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gmail_access_token TEXT,
ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS gmail_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gmail_authorized BOOLEAN DEFAULT false;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_gmail_authorized ON public.profiles(gmail_authorized) WHERE gmail_authorized = true;