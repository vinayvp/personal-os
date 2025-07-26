import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has a valid session token
    const token = sessionStorage.getItem('app_session_token');
    const expiry = sessionStorage.getItem('app_session_expiry');
    
    if (token && expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate > new Date()) {
        setIsAuthenticated(true);
        setSessionToken(token);
      } else {
        // Session expired, clear storage
        sessionStorage.removeItem('app_session_token');
        sessionStorage.removeItem('app_session_expiry');
        sessionStorage.removeItem('app_authenticated');
      }
    }
    
    setIsLoadingPassword(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-app-password', {
        body: { password },
      });

      if (error) {
        if (error.message.includes('429')) {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "Please wait a few minutes before trying again.",
          });
          return;
        }
        throw new Error(error.message);
      }

      if (data?.success && data?.sessionToken) {
        setIsAuthenticated(true);
        setSessionToken(data.sessionToken);
        
        // Store session information securely
        sessionStorage.setItem('app_authenticated', 'true');
        sessionStorage.setItem('app_session_token', data.sessionToken);
        sessionStorage.setItem('app_session_expiry', data.expiresAt);
        
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSessionToken(null);
    sessionStorage.removeItem('app_authenticated');
    sessionStorage.removeItem('app_session_token');
    sessionStorage.removeItem('app_session_expiry');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
      {children}
    </div>
  );
};

export default AuthGuard;