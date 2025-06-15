
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-background border-t py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-muted-foreground mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Vinayak Pastey. All rights reserved.
          </div>
          <div className="text-muted-foreground">
            Made with ❤️ by Vinayak Pastey
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
