import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackSubappName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SubappErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SubappErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isGuest = typeof window !== 'undefined' && window.location.pathname.startsWith('/app/guest');

      return (
        <div className="flex items-center justify-center p-8 min-h-[60vh]">
          <Card className="max-w-md w-full border-destructive/30 bg-card shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">
                Unable to display {this.props.fallbackSubappName || 'this sub-app'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>

              {isGuest && (
                <div className="p-3 bg-primary/10 rounded-lg text-xs text-primary flex items-center gap-2 text-left">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    Guest database may be missing some tables or schema columns. Try another sub-app from the menu above!
                  </span>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={this.handleReload} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

