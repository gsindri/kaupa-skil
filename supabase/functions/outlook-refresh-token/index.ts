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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get current refresh token from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('outlook_refresh_token')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.outlook_refresh_token) {
      throw new Error('No refresh token found');
    }

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Outlook OAuth credentials not configured');
    }

    // Refresh the access token
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: profile.outlook_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token refresh failed:', errorData);
      throw new Error('Failed to refresh Outlook token');
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Update profile with new tokens
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        outlook_access_token: tokenData.access_token,
        outlook_refresh_token: tokenData.refresh_token,
        outlook_token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw new Error('Failed to save refreshed token');
    }

    console.log('Outlook token refreshed successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        expires_at: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error refreshing Outlook token:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
