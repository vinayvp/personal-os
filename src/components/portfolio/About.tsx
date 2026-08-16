
import React from 'react';
import { Card } from '@/components/ui/card';
import { User, MapPin, Calendar, Wrench } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

const skills = [
  // Programming Languages
  "Java", "Python", "SQL", //[cite: 1]

  // Cloud & Data Platforms
  "GCP", "BigQuery", "Google Cloud Storage (GCS)", "Pub/Sub", "Data Catalog", "Dataplex", //[cite: 1]

  // Data Engineering
  "Change Data Capture (CDC)", "Debezium", "Real-Time Data Ingestion", "Batch Processing", "Stream Processing", "ETL", "ELT", "Apache NiFi", "Event-Driven Architecture", //[cite: 1]

  // Databases
  "PostgreSQL", //[cite: 1]

  // Distributed Systems & Architecture
  "Distributed Systems", "Docker", "Kubernetes", "System Design", "Technical Design", //[cite: 1]

  // Testing
  "Automated Testing", "Unit Testing", "Integration Testing", "JUnit", "Mockito", //[cite: 1]

  // Build & Development
  "Git", "Gradle", "Maven", "REST APIs", //[cite: 1]

  // Observability & Reliability
  "Prometheus", "Grafana", "Loki", "Redash", "Monitoring", "Alerting", "Incident Response", "Production Reliability", "Root Cause Analysis", //[cite: 1]

  // Data & Engineering Practices
  "Data Quality", "Data Consistency", "Data Governance", "PII Discovery", "Performance Optimization", "Cost Optimization", //[cite: 1]

  // Other / Tools
  "AI-Assisted Software Development", "Claude Code", "Mentoring", "Technical Interviewing" //[cite: 1]
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
              3.5+ Years Experience
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
                  I’m a Software Engineer with 3.5+ years of experience in Data Engineering, building scalable data platforms and distributed systems for high-volume, real-time workloads, with a focus on reliability, performance, and cost efficiency.
I specialize in real-time CDC, high-throughput data ingestion, ETL/ELT, distributed systems, and data platform architecture. My core stack includes Java, Python, SQL, GCP, BigQuery, Kubernetes, Debezium, Apache NiFi, and Docker.
                </p>
                <p className="leading-relaxed">
                  I’ve built and scaled ingestion platforms supporting 7K+ tables and 10M+ events/day. I redesigned ingestion architecture to reduce infrastructure costs by 69% and built a real-time CDC platform that reduced data freshness from 1–2 hours to ~0.8 seconds. Implemented ingestion pipeine to perform incremental transformations to reduce BigQuery costs by ~83%.
                </p>
                <p className="leading-relaxed">
                  Beyond engineering, I contribute to hiring by conducting technical and behavioral interviews for intern and junior engineering roles and serving as a primary interviewer during campus recruitment drives.
Open to Relocate. Let’s connect if you’re building scalable data platforms, real-time data infrastructure, or distributed systems.
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
