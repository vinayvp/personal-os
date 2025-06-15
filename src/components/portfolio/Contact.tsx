
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mail, Github, Linkedin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const { toast } = useToast()
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    toast({
      title: "Success!",
      description: "Your message has been sent.",
    })
    setFormData({ name: '', email: '', message: '' });
  };
  
  return (
    <section 
      id="contact" 
      ref={ref}
      className={cn("py-20 px-6 opacity-0", isVisible && "animate-fade-in")}
    >
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
            <Card className="p-8">
              <h3 className="text-2xl font-semibold mb-6">Let's Connect</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <a href="mailto:vinayakpastey1@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                    vinayakpastey1@gmail.com
                  </a>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://github.com/vinayvp" target="_blank" rel="noopener noreferrer">
                      <Github className="w-5 h-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://www.linkedin.com/in/vinayak-pastey-programmer/" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="min-h-[120px]"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" size="lg">
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;
