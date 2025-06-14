
import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import TrackingApp from '@/components/TrackingApp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText } from 'lucide-react';

type AppType = 'tracker' | 'notes';

const App = () => {
  const [activeApp, setActiveApp] = useState<AppType>('tracker');

  const NotesApp = () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notes App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Notes app coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* App Navigation */}
        <nav className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-foreground">My Apps</h1>
              <div className="flex gap-2">
                <Button
                  variant={activeApp === 'tracker' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveApp('tracker')}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Tracker
                </Button>
                <Button
                  variant={activeApp === 'notes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveApp('notes')}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Notes
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* App Content */}
        {activeApp === 'tracker' && <TrackingApp />}
        {activeApp === 'notes' && <NotesApp />}
      </div>
    </AuthGuard>
  );
};

export default App;
