import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contains user_id
    
    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing authorization code or state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Gmail Auth - Environment check:', {
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
      hasRedirectUri: !!GOOGLE_REDIRECT_URI,
      redirectUri: GOOGLE_REDIRECT_URI
    });

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      const missingVars = [];
      if (!GOOGLE_CLIENT_ID) missingVars.push('GOOGLE_CLIENT_ID');
      if (!GOOGLE_CLIENT_SECRET) missingVars.push('GOOGLE_CLIENT_SECRET');
      if (!GOOGLE_REDIRECT_URI) missingVars.push('GOOGLE_REDIRECT_URI');
      
      console.error('Missing Google OAuth credentials:', missingVars);
      throw new Error(`Missing Google OAuth credentials: ${missingVars.join(', ')}`);
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Store tokens in user's profile (using service role key)
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        gmail_access_token: access_token,
        gmail_refresh_token: refresh_token,
        gmail_token_expires_at: expiresAt.toISOString(),
        gmail_authorized: true,
      })
      .eq('id', state);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw new Error('Failed to store tokens');
    }

    // Redirect back to the app with success message
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${SUPABASE_URL}/auth/v1/callback?type=gmail_auth_success`,
      },
    });

  } catch (error) {
    console.error('Gmail OAuth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
