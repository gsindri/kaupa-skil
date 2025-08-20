
import React, { useState } from 'react';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmailConfirmationProps {
  email: string;
  onBack: () => void;
}

export function EmailConfirmation({ email, onBack }: EmailConfirmationProps) {
  const [isResending, setIsResending] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // We can't resend with just email, so we'll show a helpful message instead
      toast({
        title: "Check your spam folder",
        description: "If you don't see the email, please check your spam folder or try signing up again with a different email.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resend email",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-600">
            We've sent a confirmation link to:
          </p>
          <p className="font-medium text-gray-900">{email}</p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Click the link in the email to verify your account and complete the signup process.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">Didn't receive the email?</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="inline-flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {isResending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Try resending
            </button>
            <p className="text-xs text-gray-500">
              Check your spam folder or try a different email address
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign up
          </button>
          
          <div className="mt-3 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Already confirmed? Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
