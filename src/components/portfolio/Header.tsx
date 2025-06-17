
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Menu, X } from 'lucide-react';

interface HeaderProps {
  scrollToSection: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ scrollToSection }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (id: string) => {
    scrollToSection(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-foreground">Vinayak Pastey</div>
          
          {/* Desktop Navigation */}
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavClick('home')} 
              className="w-full justify-start text-sm"
            >
              Home
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavClick('about')} 
              className="w-full justify-start text-sm"
            >
              About
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavClick('experience')} 
              className="w-full justify-start text-sm"
            >
              Experience
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavClick('projects')} 
              className="w-full justify-start text-sm"
            >
              Projects
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavClick('contact')} 
              className="w-full justify-start text-sm"
            >
              Contact
            </Button>
            <Button asChild size="sm" className="w-full">
              <a href="/Vinayak_Pastey_Resume.pdf" download>
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </a>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
