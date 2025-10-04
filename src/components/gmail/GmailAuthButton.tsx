import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function GmailAuthButton() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkGmailAuth();
  }, []);

  async function checkGmailAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('gmail_authorized')
        .eq('id', user.id)
        .single();

      setIsAuthorized(profile?.gmail_authorized || false);
    } catch (error) {
      console.error('Error checking Gmail auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to connect Gmail',
          variant: 'destructive',
        });
        return;
      }

      // Get the OAuth URL (you'll need to set these environment variables)
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `https://hcrjkziycryuugzbixhq.supabase.co/functions/v1/gmail-auth/callback`;
      const scope = 'https://www.googleapis.com/auth/gmail.compose';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scope)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${user.id}`;

      // Open OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for popup close
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          // Recheck auth status after popup closes
          setTimeout(() => {
            checkGmailAuth();
            toast({
              title: 'Success',
              description: 'Gmail connected successfully!',
            });
          }, 1000);
        }
      }, 500);

    } catch (error) {
      console.error('Gmail auth error:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect Gmail',
        variant: 'destructive',
      });
    }
  }

  async function handleDisconnect() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          gmail_access_token: null,
          gmail_refresh_token: null,
          gmail_token_expires_at: null,
          gmail_authorized: false,
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsAuthorized(false);
      toast({
        title: 'Disconnected',
        description: 'Gmail disconnected successfully',
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Gmail',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return null;
  }

  if (isAuthorized) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Gmail Connected</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Mail className="h-4 w-4" />
      Connect Gmail
    </Button>
  );
}
