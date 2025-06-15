
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

const experiences = [
  {
    role: "Software Engineer I - Data",
    company: "Cermati.com",
    period: "Jul 2023 - Present",
    description: [
      "Refactored and improved diverse ingestion pipelines to transfer data from more than 10 different sources such as PostgreSQL, MySQL, MongoDB, Facebook, TikTok, other 3rd party APIs etc. into Google BigQuery and GCS.",
      "Designed and developed a ingestion pipeline to branch from another ingestion pipeline using Google's BigTable, Pub/Sub and BigQuery.",
      "Maintaining and expanding features in custom components of Apache Nifi.",
      "Designed and built a python client for Hashicorp's Vault and data flow service between Google DataCatalog and Dataplex.",
      "Played a crucial role in reconfiguring, re-ingesting and maintaining ingestion services during critical midnight database migrations to ensure data continuity and minimize disruptions.",
      "Mentoring and guiding interns."
    ]
  },
  {
    role: "Software Engineer Intern - Data",
    company: "Cermati.com",
    period: "Jan 2023 – Jun 2023",
    description: [
      "Implemented a Prometheus push gateway to export ingestion metrics (e.g., throughput, latency, error rates) to a Grafana dashboard for visualization and analysis.",
      "Optimized ingestion configurations to enhance performance and usability. Developed a command-line interface (CLI) client and a REST API endpoint to allow for dynamic configuration updates.",
      "Served as an on-call engineer for the ingestion and related services. Responded to incidents, performed root cause analysis, implemented corrective actions, and ensured service availability and performance."
    ]
  },
  {
    role: "Project Intern",
    company: "Samsung R&D Institute India · Internship",
    period: "Jul 2021 – Jun 2022",
    description: [
      "Programmed and implemented a dataset handling and annotation pipeline for Pose Estimation AI Applications.",
      "Modelled a neural net for in-house dataset which resulted in an accuracy of 87%."
    ]
  },
  {
    role: "Team Manager",
    company: "aerokle Aerodesign Team",
    period: "Oct 2021 – Dec 2022",
    description: [
      "Supervised the team in Research and Development of UAVs in Forestry Applications.",
      "Mentored and Oversaw the team for SAE INDIA Aero-design Challenge 2021-22 and SAE Aerothon 2022.",
      "Built and integrated an Object Detection and Avoidance Algorithm (AI / ML) on a drone using YOLOv4 tiny and IOT sensors."
    ]
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
            My professional journey.
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
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {exp.description.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
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
