
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mail, Github, Linkedin, ExternalLink, Download, MapPin, Calendar, User, Rocket } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

const skills = [
  "Python", "SQL", "Apache Spark", "Apache Airflow", "BigQuery", "AWS", "Docker", "Kubernetes",
  "Data Warehousing", "ETL Pipelines", "Machine Learning", "PostgreSQL", "Redis", "Kafka",
  "Git", "CI/CD", "Linux", "Bash Scripting", "Data Modeling", "Data Governance"
];

const projects = [
  {
    title: "Real-Time Data Pipeline",
    description: "Built a scalable real-time data pipeline processing 1M+ events per day using Apache Kafka, Spark Streaming, and AWS services. Implemented data quality checks and monitoring dashboards.",
    technologies: ["Apache Kafka", "Spark Streaming", "AWS Lambda", "DynamoDB", "CloudWatch"],
    github: "https://github.com/example/realtime-pipeline",
    live: "https://pipeline-demo.example.com"
  },
  {
    title: "ML-Powered Analytics Platform",
    description: "Developed an end-to-end analytics platform with ML models for predictive analytics. Integrated with BigQuery and built interactive dashboards using React and D3.js.",
    technologies: ["BigQuery", "Python", "TensorFlow", "React", "D3.js", "GCP"],
    github: "https://github.com/example/ml-analytics",
    live: "https://analytics-demo.example.com"
  },
  {
    title: "Data Lake Architecture",
    description: "Designed and implemented a data lake on AWS S3 with automated ETL processes using Airflow. Optimized query performance by 70% using partitioning strategies.",
    technologies: ["AWS S3", "Apache Airflow", "Glue", "Athena", "Python", "Terraform"],
    github: "https://github.com/example/data-lake",
    live: null
  },
  {
    title: "Financial Data Warehouse",
    description: "Built a financial data warehouse handling 500GB+ daily data ingestion. Implemented CDC using Debezium and created automated reporting pipelines.",
    technologies: ["PostgreSQL", "Debezium", "Apache Spark", "Tableau", "Docker"],
    github: "https://github.com/example/financial-dw",
    live: null
  }
];

const Home = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    toast({
      title: "Success!",
      description: "Your message has been sent.",
    })
    setFormData({ name: '', email: '', message: '' });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-foreground">Vishnu Prasad</div>
            <div className="hidden md:flex space-x-6">
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('home')} className="text-sm">
                Home
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('about')} className="text-sm">
                About
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('projects')} className="text-sm">
                Projects
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollToSection('contact')} className="text-sm">
                Contact
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative px-6 pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute w-full h-full">
            <div className="grid grid-cols-20 gap-1 w-full h-full opacity-20">
              {Array.from({ length: 400 }).map((_, i) => (
                <div key={i} className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }} />
              ))}
            </div>
          </div>
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
            Vishnu Prasad.
          </h1>
          
          {/* Professional Title and Description */}
          <div className="mb-8 space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              Data Engineer.{' '}
              <span className="text-muted-foreground">
                A passionate engineer with expertise in building scalable data infrastructure.
              </span>
            </h2>
          </div>

          {/* Current Status */}
          <div className="mb-12 space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Rocket className="w-5 h-5 text-primary" />
              <span>Currently specializing in Data Engineering (Python / Apache Spark)</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="text-yellow-400">⚡</span>
              <span>Data Engineer at <span className="text-primary font-medium">TechCorp</span></span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-6">
            <Button variant="ghost" size="sm" className="glass-button text-muted-foreground hover:text-primary">
              <Github className="w-4 h-4 mr-2" />
              Github
            </Button>
            <Button variant="ghost" size="sm" className="glass-button text-muted-foreground hover:text-primary">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
            <Button variant="ghost" size="sm" className="glass-button text-muted-foreground hover:text-primary">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">About Me</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get to know more about me, my background, and what drives my passion for data engineering.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <Card className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Professional Summary</h3>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    I'm a dedicated Data Engineer with 2 years of hands-on experience in designing, 
                    building, and maintaining data infrastructure. I specialize in creating efficient 
                    ETL pipelines, optimizing data workflows, and ensuring data quality across large-scale systems.
                  </p>
                  <p className="leading-relaxed">
                    My passion lies in solving complex data challenges and building systems that can 
                    handle massive amounts of data while maintaining performance and reliability.
                  </p>
                </div>
              </Card>

              <Card className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Location & Experience</h3>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Based in India</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>2+ Years Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <Button variant="link" className="p-0 h-auto text-primary">
                      Download Resume
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
            
            <div>
              <Card className="glass-card p-8">
                <h3 className="text-2xl font-semibold mb-6">Technical Skills</h3>
                <div className="grid grid-cols-2 gap-3">
                  {skills.map((skill) => (
                    <div key={skill} className="glass px-4 py-2 rounded-lg text-center text-sm font-medium hover:scale-105 transition-transform duration-200">
                      {skill}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6 bg-muted/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Featured Projects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Here are some of my recent data engineering projects that showcase my skills and experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <Card key={index} className="glass-card group hover:scale-105 transition-all duration-300">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300 flex-1">
                      {project.title}
                    </h3>
                    <div className="flex gap-2 ml-4">
                      {project.github && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 glass-button">
                          <Github className="w-4 h-4" />
                        </Button>
                      )}
                      {project.live && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 glass-button">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get In Touch</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              I'm always interested in discussing new opportunities, collaborating on exciting projects, 
              or just chatting about data engineering challenges.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Card className="glass-card p-8">
                <h3 className="text-2xl font-semibold mb-6">Let's Connect</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <a href="mailto:vishnuprasad@example.com" className="text-muted-foreground hover:text-primary transition-colors">
                      vishnuprasad@example.com
                    </a>
                  </div>
                  
                  <div className="flex gap-4 mt-6">
                    <Button variant="outline" size="icon" className="glass-button">
                      <Github className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="glass-button">
                      <Linkedin className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
            
            <Card className="glass-card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="glass-input"
                    required
                  />
                </div>
                
                <div>
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="glass-input"
                    required
                  />
                </div>
                
                <div>
                  <Textarea
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="glass-input min-h-[120px]"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full glass-button" size="lg">
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-nav py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Vishnu Prasad. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="glass-button"
                asChild
              >
                <a href="/app">My Apps</a>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
