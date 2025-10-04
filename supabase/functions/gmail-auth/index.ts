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

    // Return HTML with clean success screen
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gmail Connected</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              border-radius: 16px;
              padding: 48px 40px;
              text-align: center;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              max-width: 400px;
            }
            .icon {
              width: 64px;
              height: 64px;
              background: #34A853;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
            }
            .checkmark {
              width: 32px;
              height: 32px;
              border: 3px solid white;
              border-top: none;
              border-left: none;
              transform: rotate(45deg);
              margin-top: -8px;
            }
            h1 {
              margin: 0 0 12px;
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
            }
            p {
              margin: 0 0 32px;
              color: #6b7280;
              font-size: 14px;
            }
            button {
              background: #4285f4;
              color: white;
              border: none;
              border-radius: 8px;
              padding: 14px 32px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
              width: 100%;
            }
            button:hover {
              background: #3367d6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">
              <div class="checkmark"></div>
            </div>
            <h1>Gmail Connected!</h1>
            <p>Your Gmail account has been successfully connected.</p>
            <button onclick="window.close()">Close Window</button>
          </div>
          <script>
            // Notify parent window
            if (window.opener) {
              window.opener.postMessage({ type: 'GMAIL_AUTH_SUCCESS' }, '*');
            }
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
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
