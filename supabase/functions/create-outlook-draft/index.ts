import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutlookDraftRequest {
  to: string;
  subject: string;
  body: string;
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: string }> {
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
  
  const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh Outlook access token');
  }

  const tokenData = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
  
  return {
    accessToken: tokenData.access_token,
    expiresAt: expiresAt.toISOString(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body } = await req.json() as OutlookDraftRequest;

    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, or body');
    }

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

    // Get user's Outlook tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('outlook_access_token, outlook_refresh_token, outlook_token_expires_at, outlook_authorized')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.outlook_authorized) {
      throw new Error('Outlook not authorized');
    }

    let accessToken = profile.outlook_access_token;
    const tokenExpiresAt = new Date(profile.outlook_token_expires_at);
    const now = new Date();

    // Refresh token if expired or about to expire (within 5 minutes)
    if (tokenExpiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      console.log('Refreshing Outlook access token...');
      const refreshed = await refreshAccessToken(profile.outlook_refresh_token);
      accessToken = refreshed.accessToken;

      // Update profile with new token
      await supabase
        .from('profiles')
        .update({
          outlook_access_token: accessToken,
          outlook_token_expires_at: refreshed.expiresAt,
        })
        .eq('id', user.id);
    }

    // Create draft using Microsoft Graph API
    const draftResponse = await fetch('https://graph.microsoft.com/v1.0/me/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: subject,
        body: {
          contentType: 'Text',
          content: body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      }),
    });

    if (!draftResponse.ok) {
      const errorData = await draftResponse.text();
      console.error('Failed to create Outlook draft:', errorData);
      throw new Error('Failed to create Outlook draft');
    }

    const draftData = await draftResponse.json();
    console.log('Outlook draft created successfully:', draftData.id);

    return new Response(
      JSON.stringify({
        success: true,
        draftId: draftData.id,
        webLink: draftData.webLink,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-outlook-draft:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
