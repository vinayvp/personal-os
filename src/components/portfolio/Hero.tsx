import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Github, Linkedin, Rocket } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative px-6 pt-20 overflow-hidden">
      {/* Animated Starry Background */}
      <div className="absolute inset-0 -z-10">
        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 2}px`,
              height: `${Math.random() * 2 + 2}px`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hey there text */}
        <div className="mb-8">
          <span className="text-primary text-lg font-medium">
            Hey there!, I'm-
          </span>
        </div>
        
        {/* Name */}
        <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white leading-tight">
          Vinayak Pastey.
        </h1>
        
        {/* Professional Title and Description */}
        <div className="mb-8 space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            Data Engineer.{' '}
            <span className="text-muted-foreground">
              A passionate and results-driven Data Engineer specializing in Python, Spark, Airflow, and AWS.
            </span>
          </h2>
        </div>

        {/* Current Status */}
        <div className="mb-12 space-y-3">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Rocket className="w-5 h-5 text-primary" />
            <span>Currently specializing in Data Engineering (Python / Apache Spark / Airflow / AWS)</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-yellow-400">⚡</span>
            <span>Data Engineer at <span className="text-primary font-medium">TechCorp</span></span>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-6">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" asChild>
            <a href="https://github.com/example" target="_blank" rel="noopener noreferrer">
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
            <a href="mailto:vinayakpastey@example.com">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
