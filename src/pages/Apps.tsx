
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, LogOut, Menu, X } from 'lucide-react';
import NotesApp from '@/components/NotesApp';
import TrackingApp from '@/components/TrackingApp';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Apps = () => {
  const [selectedApp, setSelectedApp] = React.useState<string>('tracking');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('app_authenticated');
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAppSelect = (app: string) => {
    setSelectedApp(app);
    setIsMobileMenuOpen(false);
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
      <header className="relative flex items-center justify-between p-4 border-b shrink-0 border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold mr-4 text-foreground">My Apps</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Logout */}
          <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
          
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleMobileMenu} 
            className="md:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <div 
          id="mobile-menu"
          className={`absolute top-full left-0 right-0 bg-background border-b md:hidden z-50 transition-all duration-200 ease-in-out ${
            isMobileMenuOpen 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="p-4 space-y-2">
            <Button
              variant={selectedApp === 'tracking' ? 'default' : 'outline'}
              onClick={() => handleAppSelect('tracking')}
              size="sm"
              className="w-full justify-start"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Tracker
            </Button>
            <Button
              variant={selectedApp === 'notes' ? 'default' : 'outline'}
              onClick={() => handleAppSelect('notes')}
              size="sm"
              className="w-full justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              Notes
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout} 
              className="w-full justify-start"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        {renderSelectedApp()}
      </main>
    </div>
  );
};

export default Apps;
