import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// 1. Import the Biometric Plugin
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(true);
  const { toast } = useToast();

  // 2. Wrap login logic in a reusable function for auto-fill
  const performLogin = useCallback(async (pwd: string) => {
    const { data, error } = await supabase.functions.invoke('check-app-password', {
      body: { password: pwd },
    });

    if (data?.success) {
      setIsAuthenticated(true);
      sessionStorage.setItem('app_authenticated', 'true');
      
      // 3. Save to Secure Storage on successful manual login
      if (Capacitor.getPlatform() === 'android') {
        await NativeBiometric.setCredentials({
          address: 'vinayak-app',
          username: 'user',
          password: pwd,
          server: 'auth-vault',
        }).catch(e => console.error("Could not save credentials", e));
      }
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const isAuth = sessionStorage.getItem('app_authenticated') === 'true';
      setIsAuthenticated(isAuth);

      // 4. BIOMETRIC AUTO-LOGIN ATTEMPT
      if (!isAuth && Capacitor.getPlatform() === 'android') {
        try {
          const available = await NativeBiometric.isAvailable();
          if (available.isAvailable) {
            const credentials = await NativeBiometric.getCredentials({
              address: 'vinayak-app',
              server: 'auth-vault',
            });

            if (credentials) {
              await NativeBiometric.verifyIdentity({
                reason: "Unlock your applications",
                title: "Login with Fingerprint"
              });

              setIsLoading(true);
              const success = await performLogin(credentials.password);
              if (success) {
                toast({ title: "Welcome back!", description: "Biometric auth successful." });
              }
              setIsLoading(false);
            }
          }
        } catch (e) {
          console.log("Biometric auth skipped or failed", e);
        }
      }
      setIsLoadingPassword(false);
    };

    initAuth();
  }, [performLogin, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await performLogin(password);
      if (!success) {
        toast({
          variant: "destructive",
          title: "Invalid Password",
          description: "Please enter the correct password.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  if (isLoadingPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Applications
            </CardTitle>
            <p className="text-muted-foreground">Enter your password to access your applications</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Access Applications'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;