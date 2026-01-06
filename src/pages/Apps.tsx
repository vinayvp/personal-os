
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, LogOut, Menu, X, CheckSquare, BookOpen, Notebook, Film, DollarSign, Github } from 'lucide-react';
import NotesApp from '@/components/NotesApp';
import TrackingApp from '@/components/TrackingApp';
import TodoApp from '@/components/TodoApp';
import LessonsApp from '@/components/LessonsApp';
import JournalApp from '@/components/JournalApp';
import MoviesApp from '@/components/MoviesApp';
import FinancialApp from '@/components/financial/FinancialApp';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Apps = () => {
  const [selectedApp, setSelectedApp] = React.useState<string>('tracking');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('app_authenticated');
    // Stay on /app route, but AuthGuard will show login form
    window.location.reload();
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
      case 'todos':
        return <TodoApp />;
      case 'lessons':
        return <LessonsApp />;
      case 'journal':
        return <JournalApp />;
      case 'movies':
        return <MoviesApp />;
      case 'financial':
        return <FinancialApp />;
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
              variant={selectedApp === 'todos' ? 'default' : 'outline'}
              onClick={() => setSelectedApp('todos')}
              size="sm"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Todos
            </Button>
            <Button
              variant={selectedApp === 'notes' ? 'default' : 'outline'}
              onClick={() => setSelectedApp('notes')}
              size="sm"
            >
              <FileText className="mr-2 h-4 w-4" />
              Notes
            </Button>
            <Button
              variant={selectedApp === 'journal' ? 'default' : 'outline'}
              onClick={() => setSelectedApp('journal')}
              size="sm"
            >
              <Notebook className="mr-2 h-4 w-4" />
              Journal
            </Button>
            <Button
              variant={selectedApp === 'lessons' ? 'default' : 'outline'}
              onClick={() => setSelectedApp('lessons')}
              size="sm"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Lessons
            </Button>
            <Button
              variant={selectedApp === 'movies' ? 'default' : 'outline'}
              onClick={() => setSelectedApp('movies')}
              size="sm"
            >
              <Film className="mr-2 h-4 w-4" />
              Movies & TV
            </Button>
            <Button
              variant={selectedApp === 'financial' ? 'default' : 'outline'}
              onClick={() => setSelectedApp('financial')}
              size="sm"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Finance
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop External Links */}
          <Button variant="outline" size="sm" asChild className="hidden md:flex">
            <a href="https://github.com/vinayvp/portfolio_and_apps" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden md:flex">
            <a href="https://app.netlify.com/projects/vinayvp/overview" target="_blank" rel="noopener noreferrer">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .366-.18l.575-3.455-2.13-.472-2.517 2.051zM11.2 8.292l-5.099 4.391.862 10.217 2.937-2.937-1.5-5.8 5.1-4.391-.8-1.48zm.053-1.016l.773 1.428 5.937-2.489.491-2.953-7.201 4.014zm.053 1.016l.8 1.48 4.2-1.76-1.503-3.234-3.497 1.514zm-5.099 4.391l1.5 5.8 6.1-5.252-.8-1.48-5.8 4.932-.862-10.217-4.591.491 4.453 5.726zm5.099-4.391l.8 1.48 5.099-4.391-7.599 2.091.8 1.48 5.099-4.391-.8-1.48-3.399 5.211z"/>
              </svg>
              Netlify
            </a>
          </Button>
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
              variant={selectedApp === 'todos' ? 'default' : 'outline'}
              onClick={() => handleAppSelect('todos')}
              size="sm"
              className="w-full justify-start"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Todos
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
              variant={selectedApp === 'journal' ? 'default' : 'outline'}
              onClick={() => handleAppSelect('journal')}
              size="sm"
              className="w-full justify-start"
            >
              <Notebook className="mr-2 h-4 w-4" />
              Journal
            </Button>
            <Button
              variant={selectedApp === 'lessons' ? 'default' : 'outline'}
              onClick={() => handleAppSelect('lessons')}
              size="sm"
              className="w-full justify-start"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Lessons
            </Button>
            <Button
              variant={selectedApp === 'movies' ? 'default' : 'outline'}
              onClick={() => handleAppSelect('movies')}
              size="sm"
              className="w-full justify-start"
            >
              <Film className="mr-2 h-4 w-4" />
              Movies & TV
            </Button>
            <Button
              variant={selectedApp === 'financial' ? 'default' : 'outline'}
              onClick={() => handleAppSelect('financial')}
              size="sm"
              className="w-full justify-start"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Finance
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <a href="https://github.com/vinayvp/portfolio_and_apps" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <a href="https://app.netlify.com/projects/vinayvp/overview" target="_blank" rel="noopener noreferrer">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .366-.18l.575-3.455-2.13-.472-2.517 2.051zM11.2 8.292l-5.099 4.391.862 10.217 2.937-2.937-1.5-5.8 5.1-4.391-.8-1.48zm.053-1.016l.773 1.428 5.937-2.489.491-2.953-7.201 4.014zm.053 1.016l.8 1.48 4.2-1.76-1.503-3.234-3.497 1.514zm-5.099 4.391l1.5 5.8 6.1-5.252-.8-1.48-5.8 4.932-.862-10.217-4.591.491 4.453 5.726zm5.099-4.391l.8 1.48 5.099-4.391-7.599 2.091.8 1.48 5.099-4.391-.8-1.48-3.399 5.211z"/>
                </svg>
                Netlify
              </a>
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
