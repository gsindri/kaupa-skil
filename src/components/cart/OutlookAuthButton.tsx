import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';

export function OutlookAuthButton({ minimal = false, onAuthChange, className }: { minimal?: boolean; onAuthChange?: () => void; className?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['outlook-auth-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('outlook_authorized')
        .eq('id', user.id)
        .single();

      return data;
    },
  });

  if (isLoading) {
    if (minimal) {
      return <div className={`h-7 w-24 animate-pulse rounded bg-slate-100 ${className}`} />;
    }
    return (
      <Button variant="outline" className={`w-full ${className}`} disabled>
        <Mail className="mr-2 h-4 w-4 opacity-50" />
        Loading...
      </Button>
    );
  }

  const handleAuthorize = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to connect Outlook',
          variant: 'destructive',
        });
        return;
      }

      // Get Microsoft OAuth credentials from Supabase secrets
      // The client ID is managed on the backend for security
      const redirectUri = encodeURIComponent(window.location.origin + '/outlook-callback');
      const scope = encodeURIComponent('offline_access Mail.ReadWrite Mail.Send User.Read openid profile email');

      // For now, we'll need to store the client ID in the database or fetch it from the backend
      // This is a placeholder - in production, this should come from your Azure app registration
      const clientId = '979669cd-129b-4971-9470-401f3989a394';

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `response_mode=query&` +
        `prompt=consent`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Outlook authorization:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate Outlook authorization',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          outlook_access_token: null,
          outlook_refresh_token: null,
          outlook_token_expires_at: null,
          outlook_authorized: false,
        })
        .eq('id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['outlook-auth-status'] });
      onAuthChange?.();

      toast({
        title: 'Disconnected',
        description: 'Outlook has been disconnected',
      });
    } catch (error) {
      console.error('Failed to disconnect Outlook:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Outlook',
        variant: 'destructive',
      });
    }
  };

  if (profile?.outlook_authorized) {
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
      <div className={`flex items-center gap-2 p-3 bg-muted rounded-lg ${className}`}>
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Outlook Connected</span>
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
      onClick={handleAuthorize}
      variant="outline"
      className={minimal ? `h-9 px-3 py-1 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-600 hover:text-blue-600 ${className}` : `w-full ${className}`}
    >
      {!minimal && <Mail className="mr-2 h-4 w-4" />}
      Connect Outlook
    </Button>
  );
}
