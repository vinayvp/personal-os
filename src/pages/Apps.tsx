
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp } from 'lucide-react';
import NotesApp from '@/components/NotesApp';
import TrackingApp from '@/components/TrackingApp';

const Apps = () => {
  const [selectedApp, setSelectedApp] = React.useState<string>('tracking');

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
      <header className="flex items-center p-4 border-b shrink-0 border-border">
        <h1 className="text-xl font-bold mr-6 text-foreground">My Apps</h1>
        <div className="flex items-center gap-2">
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
      </header>
      <main className="flex-1 overflow-y-auto">
        {renderSelectedApp()}
      </main>
    </div>
  );
};

export default Apps;
