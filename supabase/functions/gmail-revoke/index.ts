import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get the user from the auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Revoking Gmail access for user:', user.id);

    // Get the user's Gmail access token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gmail_access_token')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.gmail_access_token) {
      console.log('No access token found, clearing database only');
      // No token to revoke, just clear the database
      await supabase
        .from('profiles')
        .update({
          gmail_access_token: null,
          gmail_refresh_token: null,
          gmail_token_expires_at: null,
          gmail_authorized: false,
        })
        .eq('id', user.id);

      return new Response(
        JSON.stringify({ success: true, revoked: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revoke the token at Google
    console.log('Calling Google revoke API');
    const revokeResponse = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${profile.gmail_access_token}`,
      { method: 'POST' }
    );

    if (!revokeResponse.ok && revokeResponse.status !== 400) {
      // 400 can mean token already invalid, which is fine
      console.error('Google revoke failed:', revokeResponse.status, await revokeResponse.text());
      throw new Error(`Failed to revoke token at Google: ${revokeResponse.status}`);
    }

    console.log('Google revoke successful, clearing database');

    // Clear tokens from database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        gmail_access_token: null,
        gmail_refresh_token: null,
        gmail_token_expires_at: null,
        gmail_authorized: false,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, revoked: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Gmail revoke error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
