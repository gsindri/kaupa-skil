import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function GmailAuthButton({ minimal = false, onAuthChange, className }: { minimal?: boolean; onAuthChange?: () => void; className?: string }) {
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
      onAuthChange?.();
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

      // Get the OAuth URL
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

      // Listen for postMessage from OAuth popup
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
          window.removeEventListener('message', messageHandler);
          checkGmailAuth();
          toast({
            title: 'Success',
            description: 'Gmail connected successfully!',
          });
        }
      };
      window.addEventListener('message', messageHandler);

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

      // Fallback: detect if popup was closed without success
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
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
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in',
          variant: 'destructive',
        });
        return;
      }

      // Call the revoke function to properly disconnect at Google
      const { data, error } = await supabase.functions.invoke('gmail-revoke', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setIsAuthorized(false);
      onAuthChange?.();
      toast({
        title: 'Disconnected',
        description: data.revoked
          ? 'Gmail access revoked at Google and disconnected successfully'
          : 'Gmail disconnected successfully',
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Gmail',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    if (minimal) {
      return <div className={`h-7 w-24 animate-pulse rounded bg-slate-100 ${className}`} />;
    }
    return (
      <Button variant="outline" size="sm" disabled className={`gap-2 ${className}`}>
        <Mail className="h-4 w-4 opacity-50" />
        Loading...
      </Button>
    );
  }

  if (isAuthorized) {
    if (minimal) {
      return (
        <button
          onClick={handleDisconnect}
          className={`text-xs font-medium text-slate-500 transition-colors hover:text-red-600 hover:underline ${className}`}
        >
          Disconnect
        </button>
      );
    }
    return (
      <div className={`flex items-center gap-2 ${className}`}>
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
      className={minimal ? `h-9 px-3 py-1 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-600 hover:text-blue-600 ${className}` : `gap-2 ${className}`}
    >
      {!minimal && <Mail className="h-4 w-4" />}
      Connect Gmail
    </Button>
  );
}
