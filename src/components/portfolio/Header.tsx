
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface HeaderProps {
  scrollToSection: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ scrollToSection }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-foreground">Vinayak Pastey</div>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('home')} className="text-sm">
                Home
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('about')} className="text-sm">
                About
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('experience')} className="text-sm">
                Experience
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('projects')} className="text-sm">
                Projects
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('contact')} className="text-sm">
                Contact
              </Button>
            </div>
            
            <div className="pl-2">
                <Button asChild size="sm">
                    <a href="/Vinayak_Pastey_Resume.pdf" download>
                        <Download className="w-4 h-4 mr-2" />
                        Download Resume
                    </a>
                </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
