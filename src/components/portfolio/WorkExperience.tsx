
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

const experiences = [
  {
    role: "Data Engineer",
    company: "Cermati",
    period: "2023 - Present",
    description: "Responsible for designing, building, and maintaining scalable data pipelines using Java, Python, SQL, and GCP. As I mentioned, I can't fetch real-time data from LinkedIn, so I've used this as a placeholder based on your input."
  },
  {
    role: "Junior Data Analyst",
    company: "Data Corp (Placeholder)",
    period: "2022 - 2023",
    description: "This is a placeholder entry to demonstrate the timeline format. Please provide your actual work history to replace this."
  }
];

const WorkExperience = () => {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

  return (
    <section 
      id="experience" 
      ref={ref}
      className={cn("py-20 px-6 opacity-0", isVisible && "animate-fade-in")}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Work Experience</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            My professional journey. As I can't access LinkedIn, I've added placeholder content based on your info.
          </p>
        </div>

        <div className="relative border-l-2 border-primary/20 pl-8 space-y-8">
          {experiences.map((exp, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-[41px] top-1 w-4 h-4 bg-primary rounded-full border-4 border-background"></div>
              <Card>
                <CardHeader>
                  <CardTitle>{exp.role}</CardTitle>
                  <CardDescription>{exp.company} • {exp.period}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{exp.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkExperience;

