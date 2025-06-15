
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, LogOut } from 'lucide-react';
import NotesApp from '@/components/NotesApp';
import TrackingApp from '@/components/TrackingApp';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Apps = () => {
  const [selectedApp, setSelectedApp] = React.useState<string>('tracking');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('app_authenticated');
    navigate('/');
  };

  const renderSelectedApp = () => {
    switch (selectedApp) {
      case 'notes':
        return <NotesApp />;
      case 'tracking':
        return <TrackingApp />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b shrink-0 border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold mr-4 text-foreground">My Apps</h1>
          <Button
            variant={selectedApp === 'tracking' ? 'default' : 'outline'}
            onClick={() => setSelectedApp('tracking')}
            size="sm"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Tracker
          </Button>
          <Button
            variant={selectedApp === 'notes' ? 'default' : 'outline'}
            onClick={() => setSelectedApp('notes')}
            size="sm"
          >
            <FileText className="mr-2 h-4 w-4" />
            Notes
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto">
        {renderSelectedApp()}
      </main>
    </div>
  );
};

export default Apps;
