
import React from 'react';
import { Card } from '@/components/ui/card';
import { User, MapPin, Calendar, Wrench } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

const skills = [
  "Java", "Python", "JavaScript", "SQL", "PostgreSQL", "GCP", "BigQuery",
  "Apache NiFi", "Docker", "Kubernetes", "Data Warehousing", "ETL/ELT Pipelines",
  "Git", "REST APIs", "Prometheus", "Loki", "Redash", "Mentoring",
  "Problem Solving", "Debezium", "Batch & Streaming Pipelines"
];

const About = () => {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

  return (
    <section 
      id="about" 
      ref={ref}
      className={cn("py-20 px-6 opacity-0", isVisible && "animate-fade-in")}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">About Me</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get to know more about me, my background, and what drives my passion for data engineering.
          </p>
          <p className="mt-6 font-bold text-primary text-lg flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Based in India
            </span>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              2+ Years Experience
            </span>
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-semibold">Professional Summary</h3>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">
                  I am a passionate and results-driven Data Engineer with over 2 years of hands-on experience in designing, developing, and maintaining robust data pipelines. I specialize in building end-to-end scalable Batch and Streaming data solutions, with experience in handling the ingestion of up to 2 petabytes of data.
                </p>
                <p className="leading-relaxed">
                  My technical proficiency includes Java, Python, PostgreSQL, Apache NiFi, BigQuery, and a broad range of Google Cloud Platform (GCP) services. I’ve consistently delivered systems that transform raw data into reliable, actionable insights to drive strategic business decisions.
                </p>
                <p className="leading-relaxed">
                  I thrive on solving complex data challenges and am committed to enabling data-driven decision-making through high-performance engineering and architecture.
                </p>
              </div>
            </Card>
          </div>
          
          <div>
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Wrench className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-semibold">Technical Skills</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {skills.map((skill) => (
                  <div key={skill} className="border px-4 py-2 rounded-lg text-center text-sm font-medium hover:scale-105 transition-transform duration-200">
                    {skill}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
