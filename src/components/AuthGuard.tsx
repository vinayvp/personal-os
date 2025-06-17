
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appPassword, setAppPassword] = useState<string | null>(null);
  const [isLoadingPassword, setIsLoadingPassword] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated (stored in sessionStorage)
    const isAuth = sessionStorage.getItem('app_authenticated') === 'true';
    setIsAuthenticated(isAuth);

    // Fetch the password from app_settings table
    const fetchAppPassword = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'app_password')
          .single();

        if (error) {
          console.error('Error fetching app password:', error);
          toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Could not load application settings. Please contact administrator.",
          });
          return;
        }

        setAppPassword(data?.setting_value || null);
      } catch (error) {
        console.error('Error fetching app password:', error);
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Could not load application settings. Please contact administrator.",
        });
      } finally {
        setIsLoadingPassword(false);
      }
    };

    fetchAppPassword();
  }, [toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appPassword) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Application password not configured. Please contact administrator.",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (password === appPassword) {
        setIsAuthenticated(true);
        sessionStorage.setItem('app_authenticated', 'true');
        toast({
          title: "Welcome!",
          description: "Successfully logged in to your applications.",
        });
      } else {
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
                disabled={!appPassword}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !appPassword}
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
