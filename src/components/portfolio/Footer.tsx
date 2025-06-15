
import React from 'react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-background border-t py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-muted-foreground mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Vinayak Pastey. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <a href="/app">My Apps</a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
