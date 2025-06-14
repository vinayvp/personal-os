
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Mail, ExternalLink, Code, Palette, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">Portfolio</h1>
          <nav className="flex items-center gap-4">
            <Link to="/tracker">
              <Button variant="outline" size="sm">
                Tracker App
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground">
              Welcome to My Portfolio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Full-stack developer passionate about creating beautiful and functional web applications
            </p>
          </div>
          
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Get In Touch
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              View Projects
            </Button>
          </div>
        </section>

        {/* Skills Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-foreground">Skills & Technologies</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Frontend Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                  <Badge variant="secondary">Next.js</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Design & UI/UX
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Figma</Badge>
                  <Badge variant="secondary">Adobe XD</Badge>
                  <Badge variant="secondary">Responsive Design</Badge>
                  <Badge variant="secondary">Accessibility</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Backend & Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Node.js</Badge>
                  <Badge variant="secondary">Supabase</Badge>
                  <Badge variant="secondary">Git</Badge>
                  <Badge variant="secondary">Docker</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Projects Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-foreground">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Fit & NoNut Tracker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  A personal tracking application for fitness and wellness goals with calendar views and statistics.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">React</Badge>
                  <Badge variant="outline">Supabase</Badge>
                  <Badge variant="outline">Tailwind</Badge>
                </div>
                <div className="flex gap-2">
                  <Link to="/tracker">
                    <Button size="sm" className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      View App
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Placeholder for more projects */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Project Two</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Description of another project you've worked on.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Technology</Badge>
                  <Badge variant="outline">Stack</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Github className="w-3 h-3" />
                    Code
                  </Button>
                  <Button size="sm" className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Project Three</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Description of a third project showcasing different skills.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Technology</Badge>
                  <Badge variant="outline">Stack</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Github className="w-3 h-3" />
                    Code
                  </Button>
                  <Button size="sm" className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center space-y-6 py-12">
          <h2 className="text-3xl font-bold text-foreground">Get In Touch</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            I'm always interested in new opportunities and collaborations. Let's connect!
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
