import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mail, Github, Linkedin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

const skills = [
  "Python",
  "SQL",
  "Data Warehousing",
  "ETL Pipelines",
  "Cloud Computing (AWS)",
  "Apache Spark",
  "Data Visualization",
  "Data Modeling",
  "Big Data Technologies",
  "Machine Learning",
  "REST APIs",
  "Git",
  "Docker",
  "CI/CD",
  "Linux",
  "Bash Scripting",
  "Data Analysis",
  "Data Governance",
  "Data Security",
  "Performance Tuning",
  "Monitoring and Alerting",
  "Agile Methodologies",
  "Communication",
  "Problem Solving",
  "Teamwork",
  "Leadership",
  "Time Management",
  "Adaptability",
  "Critical Thinking",
  "Creativity",
  "Attention to Detail",
  "Customer Focus",
  "Decision Making",
  "Negotiation",
  "Presentation Skills",
  "Research",
  "Strategic Planning",
  "Troubleshooting",
  "Writing",
];

const projects = [
  {
    title: "Data Pipeline for E-commerce Analytics",
    description: "Designed and implemented a scalable data pipeline to collect, process, and analyze e-commerce data. Utilized Apache Kafka for real-time data ingestion, Apache Spark for data transformation, and Apache Cassandra for storing processed data. Developed REST APIs to provide access to processed data for downstream applications.",
    technologies: ["Apache Kafka", "Apache Spark", "Apache Cassandra", "REST APIs", "Python"],
    link: "https://github.com/example/ecommerce-data-pipeline"
  },
  {
    title: "Cloud-Based Data Warehouse for Financial Data",
    description: "Built a cloud-based data warehouse on AWS to store and analyze financial data. Utilized AWS S3 for data storage, AWS Glue for data cataloging, and AWS Redshift for data warehousing. Developed ETL pipelines to load data from various sources into the data warehouse. Implemented data governance policies to ensure data quality and security.",
    technologies: ["AWS S3", "AWS Glue", "AWS Redshift", "ETL Pipelines", "Data Governance"],
    link: "https://github.com/example/financial-data-warehouse"
  },
  {
    title: "Machine Learning Model for Fraud Detection",
    description: "Developed a machine learning model to detect fraudulent transactions. Utilized Python and scikit-learn to train the model. Integrated the model into a real-time fraud detection system. Improved fraud detection accuracy by 20%.",
    technologies: ["Python", "scikit-learn", "Machine Learning", "Fraud Detection"],
    link: "https://github.com/example/fraud-detection-model"
  },
  {
    title: "Data Visualization Dashboard for Sales Performance",
    description: "Created an interactive data visualization dashboard to track sales performance. Utilized Tableau to create visualizations. Integrated the dashboard with various data sources. Improved sales team's ability to identify trends and make data-driven decisions.",
    technologies: ["Tableau", "Data Visualization", "Sales Performance"],
    link: "https://github.com/example/sales-performance-dashboard"
  },
  {
    title: "Real-Time Data Streaming Platform for Social Media Analytics",
    description: "Built a real-time data streaming platform to collect and analyze social media data. Utilized Apache Flink for real-time data processing, Apache Cassandra for data storage, and Apache Zeppelin for data visualization. Enabled real-time monitoring of social media trends and sentiment analysis.",
    technologies: ["Apache Flink", "Apache Cassandra", "Apache Zeppelin", "Real-Time Data Streaming"],
    link: "https://github.com/example/social-media-analytics-platform"
  },
  {
    title: "Data Lake for IoT Sensor Data",
    description: "Designed and implemented a data lake to store and analyze IoT sensor data. Utilized Hadoop and Spark for data processing. Developed machine learning models to predict equipment failures. Reduced equipment downtime by 15%.",
    technologies: ["Hadoop", "Spark", "Data Lake", "IoT", "Machine Learning"],
    link: "https://github.com/example/iot-sensor-data-lake"
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
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-foreground">My Portfolio</div>
          <div className="space-x-4">
            <Button variant="ghost" size="sm" onClick={() => scrollToSection('home')}>Home</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollToSection('about')}>About</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollToSection('projects')}>Projects</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollToSection('contact')}>Contact</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative px-4">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[200%] h-[200%] animate-[spin_12s_linear_infinite]">
            <svg id="animatedGrid" width="100%" height="100%" viewBox="0 0 200 200" fill="none">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="1" height="1" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="200" height="200" fill="url(#grid)" className="text-muted-foreground opacity-5" />
            </svg>
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center z-10 max-w-4xl mx-auto">
          <div className="mb-6 text-lg text-muted-foreground animate-fade-in opacity-0 [animation-delay:0.2s] [animation-fill-mode:forwards]">
            Hey there! 👋
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in opacity-0 [animation-delay:0.4s] [animation-fill-mode:forwards]">
            I'm <span className="text-primary">Vishnu Prasad</span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl text-muted-foreground mb-8 animate-fade-in opacity-0 [animation-delay:0.6s] [animation-fill-mode:forwards]">
            Data Engineer
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in opacity-0 [animation-delay:0.8s] [animation-fill-mode:forwards]">
            Passionate about building robust data pipelines and turning raw data into actionable insights. 
            2 years of experience in data engineering with a focus on scalable solutions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in opacity-0 [animation-delay:1s] [animation-fill-mode:forwards]">
            <Button 
              size="lg" 
              className="glass-button text-lg px-8 py-6"
              onClick={() => scrollToSection('projects')}
            >
              View My Work
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="glass-button text-lg px-8 py-6"
              onClick={() => scrollToSection('contact')}
            >
              Get In Touch
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="glass-button text-lg px-8 py-6"
              asChild
            >
              <a href="/app">My Apps</a>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">About Me</h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="glass-card p-8">
                <h3 className="text-2xl font-semibold mb-6">Professional Summary</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  I'm a dedicated Data Engineer with 2 years of hands-on experience in designing, 
                  building, and maintaining data infrastructure. I specialize in creating efficient 
                  ETL pipelines, optimizing data workflows, and ensuring data quality across large-scale systems.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  My passion lies in solving complex data challenges and building systems that can 
                  handle massive amounts of data while maintaining performance and reliability.
                </p>
              </Card>
            </div>
            
            <div>
              <Card className="glass-card p-8">
                <h3 className="text-2xl font-semibold mb-6">Technical Skills</h3>
                <div className="grid grid-cols-2 gap-4">
                  {skills.map((skill) => (
                    <div key={skill} className="glass p-3 rounded-lg text-center font-medium">
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
      <section id="projects" className="py-20 px-4 bg-muted/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Featured Projects</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <Card key={index} className="glass-card group hover:scale-105 transition-all duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{project.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-muted/50 rounded-full text-xs font-medium">{tech}</span>
                    ))}
                  </div>
                  <a href={project.link} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    Learn More
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Get In Touch</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <Card className="glass-card p-8">
                <h3 className="text-2xl font-semibold mb-6">Let's Connect</h3>
                <p className="text-muted-foreground mb-8">
                  I'm always interested in discussing new opportunities, collaborating on 
                  exciting projects, or just chatting about data engineering challenges.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>vishnuprasad@example.com</span>
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
      <footer className="glass-nav py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} Vishnu Prasad. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
