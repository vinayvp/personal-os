import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface JournalAuthGuardProps {
  children: React.ReactNode;
}

const JournalAuthGuard = ({ children }: JournalAuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated (stored in sessionStorage)
    const isAuth = sessionStorage.getItem('journal_authenticated') === 'true';
    setIsAuthenticated(isAuth);
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-journal-pin', {
        body: { pin },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('journal_authenticated', 'true');
        toast({
          title: "Welcome to your Journal!",
          description: "Successfully authenticated.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid PIN",
          description: "Please enter the correct PIN to access your journal.",
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
      setPin('');
    }
  };

  if (isLoadingAuth) {
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
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Personal Journal
            </CardTitle>
            <p className="text-muted-foreground">Enter your PIN to access your private journal</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center text-lg tracking-widest"
                maxLength={6}
                required
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || pin.length < 4}
              >
                {isLoading ? 'Verifying...' : 'Access Journal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default JournalAuthGuard;