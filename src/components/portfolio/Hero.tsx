
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Github, Linkedin, Rocket, ArrowDown } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';

interface HeroProps {
  scrollToSection: (id: string) => void;
}

const Hero: React.FC<HeroProps> = ({ scrollToSection }) => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative px-6 pt-20 overflow-hidden">
      {/* Animated Starry Background has been removed */}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hey there text */}
        <div className="mb-8">
          <span className="text-primary text-lg font-medium">
            Hey there!, I'm-
          </span>
        </div>
        
        {/* Name */}
        <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white leading-tight h-24 md:h-32">
          <TypeAnimation
            sequence={[
              'Vinayak Pastey.',
              2000,
              'Data Engineer.',
              2000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
          />
        </h1>
        
        {/* Professional Title and Description */}
        <div className="mb-8 space-y-4">
          <p className="text-xl md:text-2xl text-muted-foreground">
            A passionate and results-driven Data Engineer specializing in Java, Python, SQL, and GCP.
          </p>
        </div>

        {/* Current Status */}
        <div className="mb-12 space-y-3">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Rocket className="w-5 h-5 text-primary" />
            <span>Currently specializing in Data Engineering (Java / Python / SQL / GCP)</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-yellow-400">⚡</span>
            <span>Data Engineer at <span className="text-primary font-medium">Cermati</span></span>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-6">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" asChild>
            <a href="https://github.com/vinayvp" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 mr-2" />
              Github
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" asChild>
            <a href="https://www.linkedin.com/in/vinayak-pastey-programmer/" target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" asChild>
            <a href="mailto:vinayak.pastey@gmail.com">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </a>
          </Button>
        </div>
      </div>
      
      {/* Scroll Down Arrow */}
      <div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer" 
        onClick={() => scrollToSection('about')}
      >
        <ArrowDown className="w-8 h-8 text-primary animate-bounce" />
      </div>
    </section>
  );
};

export default Hero;
