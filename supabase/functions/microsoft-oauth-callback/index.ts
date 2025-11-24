import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();
    
    if (!code) {
      throw new Error('Authorization code is required');
    }

    if (!redirect_uri) {
      throw new Error('Redirect URI is required');
    }

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Microsoft OAuth credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const tokenData = await tokenResponse.json();
    
    // Get user ID from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Update user profile with tokens
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        outlook_access_token: tokenData.access_token,
        outlook_refresh_token: tokenData.refresh_token,
        outlook_token_expires_at: expiresAt.toISOString(),
        outlook_authorized: true,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw new Error('Failed to save Outlook authorization');
    }

    console.log('Outlook authorization successful for user:', user.id);

    // Return HTML with success UI and auto-close script
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Outlook Connected</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #0078D4 0%, #00BCF2 100%);
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
              background: #0078D4;
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
              background: #0078D4;
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
              background: #005A9E;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">
              <div class="checkmark"></div>
            </div>
            <h1>Outlook Connected!</h1>
            <p>Your Outlook account has been successfully connected.</p>
            <button onclick="window.close()">Close Window</button>
          </div>
          <script>
            // Notify parent window
            if (window.opener) {
              window.opener.postMessage({ type: 'OUTLOOK_AUTH_SUCCESS' }, '*');
            }
            // Auto-close after 1.5 seconds
            setTimeout(function() {
              window.close();
            }, 1500);
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in microsoft-oauth-callback:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
