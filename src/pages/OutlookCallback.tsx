import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function OutlookCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        toast({
          title: 'Authorization Failed',
          description: 'Failed to connect Outlook',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        toast({
          title: 'Invalid Callback',
          description: 'Missing authorization code',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/outlook-callback`;
        
        const { data, error: invokeError } = await supabase.functions.invoke(
          'microsoft-oauth-callback',
          {
            body: { 
              code,
              redirect_uri: redirectUri 
            },
          }
        );

        if (invokeError) {
          throw invokeError;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setStatus('success');
        toast({
          title: 'Success',
          description: 'Outlook connected successfully',
        });
        
        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        toast({
          title: 'Connection Failed',
          description: error instanceof Error ? error.message : 'Failed to connect Outlook',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Connecting Outlook...</h2>
            <p className="text-muted-foreground">Please wait while we complete the authorization</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Success!</h2>
            <p className="text-muted-foreground">Outlook connected successfully. Redirecting...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Connection Failed</h2>
            <p className="text-muted-foreground">Redirecting back...</p>
          </>
        )}
      </div>
    </div>
  );
}
