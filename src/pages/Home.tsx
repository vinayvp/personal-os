
import React from 'react';
import Header from '@/components/portfolio/Header';
import Hero from '@/components/portfolio/Hero';
import About from '@/components/portfolio/About';
import GithubGraph from '@/components/portfolio/GithubGraph';
import Projects from '@/components/portfolio/Projects';
import Contact from '@/components/portfolio/Contact';
import Footer from '@/components/portfolio/Footer';
import WorkExperience from '@/components/portfolio/WorkExperience';

const Home = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      <Header scrollToSection={scrollToSection} />
      <main>
        <Hero scrollToSection={scrollToSection} />
        <About />
        <GithubGraph />
        <WorkExperience />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
