import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';

export function OutlookAuthButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
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
      const clientId = 'YOUR_AZURE_CLIENT_ID';
      
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
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
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
      className="w-full"
    >
      <Mail className="mr-2 h-4 w-4" />
      Connect Outlook
    </Button>
  );
}
