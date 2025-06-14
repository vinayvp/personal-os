
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Github, Linkedin, Mail, ExternalLink, Download, Code, Database, Cloud } from 'lucide-react';
import { useState } from 'react';

const Home = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">Portfolio</h1>
          <div className="hidden md:flex gap-6">
            <a href="#home" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#projects" className="text-muted-foreground hover:text-foreground transition-colors">Projects</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dotted Pattern Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 grid grid-cols-12 gap-2 transform -rotate-12">
            {Array.from({ length: 144 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary/20 rounded-sm animate-pulse"
                style={{
                  animationDelay: `${(i * 0.1) % 3}s`,
                  animationDuration: '3s'
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-6">
            <p className="text-lg text-primary font-medium animate-fade-in">Hey there! I'm—</p>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground animate-fade-in">
              Abdul Rahman.
            </h1>
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                Data Engineer
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A passionate developer with 2 years of experience specializing in data engineering and analytics solutions.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4 animate-fade-in">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Code className="w-4 h-4" />
                Currently specializing in Data Engineering (Python / SQL)
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 animate-fade-in">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="w-4 h-4" />
                Data Engineer at TechCorp
              </div>
            </div>
            <div className="flex justify-center gap-6 pt-6 animate-fade-in">
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
                <span>Github</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
                <span>LinkedIn</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-5 h-5" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Me</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Passionate about building scalable data solutions and turning raw data into actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                I'm a dedicated Data Engineer with 2 years of experience in designing and implementing robust data pipelines, 
                ETL processes, and analytics solutions. I have a strong foundation in Python, SQL, and cloud technologies, 
                with expertise in building scalable data infrastructure.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                My passion lies in solving complex data challenges and creating efficient systems that enable data-driven 
                decision making. I enjoy working with cutting-edge technologies and continuously learning new tools and 
                methodologies in the rapidly evolving data landscape.
              </p>
              <Button className="mt-6">
                <Download className="w-4 h-4 mr-2" />
                Download CV
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Data Engineering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Python</Badge>
                    <Badge variant="secondary">SQL</Badge>
                    <Badge variant="secondary">Apache Spark</Badge>
                    <Badge variant="secondary">Airflow</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-primary" />
                    Cloud & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">BigQuery</Badge>
                    <Badge variant="secondary">AWS</Badge>
                    <Badge variant="secondary">Snowflake</Badge>
                    <Badge variant="secondary">dbt</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    Programming
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Python</Badge>
                    <Badge variant="secondary">Scala</Badge>
                    <Badge variant="secondary">Java</Badge>
                    <Badge variant="secondary">Shell</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Databases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">PostgreSQL</Badge>
                    <Badge variant="secondary">MongoDB</Badge>
                    <Badge variant="secondary">Redis</Badge>
                    <Badge variant="secondary">Cassandra</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Projects</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A showcase of my data engineering projects and solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Real-time Analytics Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Built a real-time data pipeline processing 1M+ events daily using Apache Kafka, Spark Streaming, and BigQuery.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Python</Badge>
                  <Badge variant="outline">Apache Spark</Badge>
                  <Badge variant="outline">Kafka</Badge>
                  <Badge variant="outline">BigQuery</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    Code
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <CardTitle>ETL Data Warehouse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Designed and implemented a scalable ETL pipeline for a multi-source data warehouse using Airflow and dbt.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Airflow</Badge>
                  <Badge variant="outline">dbt</Badge>
                  <Badge variant="outline">Snowflake</Badge>
                  <Badge variant="outline">Docker</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    Code
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <CardTitle>ML Feature Store</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Built a feature store infrastructure to serve ML models with low-latency feature serving and batch processing.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Python</Badge>
                  <Badge variant="outline">FastAPI</Badge>
                  <Badge variant="outline">Redis</Badge>
                  <Badge variant="outline">MLflow</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    Code
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Data Quality Framework</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Developed a comprehensive data quality monitoring framework with automated alerts and data lineage tracking.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Python</Badge>
                  <Badge variant="outline">Great Expectations</Badge>
                  <Badge variant="outline">Grafana</Badge>
                  <Badge variant="outline">PostgreSQL</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    Code
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <CardTitle>CDC Data Synchronization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Implemented Change Data Capture solution for real-time database synchronization across multiple systems.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Debezium</Badge>
                  <Badge variant="outline">Kafka Connect</Badge>
                  <Badge variant="outline">PostgreSQL</Badge>
                  <Badge variant="outline">Elasticsearch</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    Code
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-card/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Get In Touch</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              I'm always interested in discussing new opportunities, data engineering challenges, or potential collaborations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Let's Connect</h3>
                <p className="text-muted-foreground mb-6">
                  Feel free to reach out if you have any questions, want to discuss a project, or just want to connect!
                </p>
                <div className="space-y-4">
                  <a href="mailto:abdul.rahman@email.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                    abdul.rahman@email.com
                  </a>
                  <a href="#" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                    <Github className="w-5 h-5" />
                    github.com/abdulrahman
                  </a>
                  <a href="#" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="w-5 h-5" />
                    linkedin.com/in/abdulrahman
                  </a>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      name="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      name="message"
                      placeholder="Your Message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Abdul Rahman. Built with React and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
