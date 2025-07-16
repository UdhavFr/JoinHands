import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');

        if (!code) throw new Error('No authentication code found in URL');

        // Step 1: Exchange code for session
        const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
        if (authError) throw authError;

        // Step 2: Wait for database propagation
        let retries = 0;
        const checkUserProfile = async (): Promise<boolean> => {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (!user || error) {
            if (retries < 3) {
              retries++;
              await new Promise(resolve => setTimeout(resolve, 500));
              return checkUserProfile();
            }
            throw new Error('User profile not found');
          }

          // Check public.users table
          const { data: publicUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (dbError || !publicUser) {
            if (retries < 3) {
              retries++;
              await new Promise(resolve => setTimeout(resolve, 500));
              return checkUserProfile();
            }
            throw new Error('Failed to verify user in database');
          }

          return true;
        };

        await checkUserProfile();
        
        setStatus('success');
        toast.success('Account successfully verified!');
        setTimeout(() => navigate('/'), 1500);

      } catch (error) {
        console.error('Authentication error:', error);
        setStatus('error');
        setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    authenticateUser();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        {status === 'loading' && (
          <div className="text-rose-600">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold mb-2">Finalizing Verification</h1>
            <p className="text-gray-600">This may take a few moments...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-green-600">
            <CheckCircle className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verification Complete!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{errorDetails}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}