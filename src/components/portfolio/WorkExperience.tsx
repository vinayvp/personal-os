import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

const experiences = [
  {
    role: "Software Engineer III – Data", //[cite: 1]
    company: "Cermati.com", //[cite: 1]
    period: "Apr 2026 - Present", //[cite: 1]
    description: [
      "Architected, designed, and productionized a scalable real-time CDC ingestion platform using Debezium and BigQuery Storage Write API, owning the architecture, TDD, implementation, unit & integration testing, production rollout, and observability; migrated 20 high-priority business tables generating 10M+ events/day, reducing data freshness from 1–2 hours to ~0.8 seconds and enabling BI teams to generate reports on demand.", //[cite: 1]
      "Upgraded dependencies across the ingestion repository spanning batch and streaming pipelines, resolving dependency conflicts and security vulnerabilities while maintaining application compatibility.", //[cite: 1]
      "Conducted technical and behavioral interviews for intern and junior engineering roles, serving as a primary interviewer during campus hiring drives at multiple colleges and contributing to hiring decisions." //[cite: 1]
    ]
  },
  {
    role: "Software Engineer II – Data", //[cite: 1]
    company: "Cermati.com", //[cite: 1]
    period: "Apr 2025 - Mar 2026", //[cite: 1]
    description: [
      "Redesigned the ingestion architecture for 7,000+ tables across 210 databases, replacing database-specific Kubernetes CronJobs with a unified scheduler-worker architecture that schedules lagging table-ingestion tasks from cron expressions and dispatches them to a shared worker pool which automatically scales based on task queue length; improved resource utilization and reduced infrastructure cost by 69%.", //[cite: 1]
      "Developed a consistent-hash-based worker rebalancing algorithm to distribute real-time CDC streams across workers while minimizing stream redistribution during worker scaling, improving worker utilization and reducing scaling-related ingestion errors.", //[cite: 1]
      "Built an organization-wide metadata extraction pipeline to reliably and securely collect column metadata and sample rows across databases and tables, and performed AI-assisted PII detection to identify sensitive columns for data governance and security.", //[cite: 1]
      "Designed and implemented 2 external API-to-BigQuery ingestion pipelines, incorporating unit and integration testing to validate data transformations, API handling, and end-to-end pipeline behavior.", //[cite: 1]
      "Mentored and led up to 4 interns/junior engineers, providing guidance on software development, data engineering, ingestion architecture, and production practices.", //[cite: 1]
      "Led the migration of the ingestion repository from Maven to Gradle, enabling parallel compilation and unit-test execution, automated execution of the full unit-test suite on every local and CI/CD build, improved build caching, and automated PKI certificate verification for Nexus; reduced typical build times from 6–8 minutes to 2–4 minutes." //[cite: 1]
    ]
  },
  {
    role: "Software Engineer I - Data", //[cite: 1]
    company: "Cermati.com", //[cite: 1]
    period: "Jul 2023 - Mar 2025", //[cite: 1]
    description: [
      "Designed and built a branched ingestion architecture to independently transform incremental data regenerated from primary ingestion workload, reducing BigQuery costs by ~83%.", //[cite: 1]
      "Refactored and enhanced ingestion pipelines spanning 10+ heterogeneous sources, including PostgreSQL, MySQL, MongoDB, and external APIs, improving reliability, maintainability, and unit-test coverage.", //[cite: 1]
      "Built new requested features for custom Apache NiFi components used for reporting workflows.", //[cite: 1]
      "Implemented multiple REST API endpoints to provide a unified data-access layer across services and reduce direct database connectivity from individual services.", //[cite: 1]
      "Improved ingestion reliability through bug fixes, refactoring, configuration optimization, test coverage and production improvements, reducing recurring operational and on-call issues.", //[cite: 1]
      "Supported critical production database migrations by reconfiguring, re-ingesting, and monitoring ingestion services, maintaining data continuity during migration windows.", //[cite: 1]
      "Built data-quality and reliability monitoring Grafana dashboards for duplicate records, missing data, missed ingestions, and pipeline health, with alerts for production failures." //[cite: 1]
    ]
  },
  {
    role: "Software Engineer Intern – Data", //[cite: 1]
    company: "Cermati.com", //[cite: 1]
    period: "Jan 2023 – Jun 2023", //[cite: 1]
    description: [
      "Implemented a Prometheus Pushgateway-based metrics pipeline exposing ingestion throughput, latency, rate and other metrics for Grafana-based monitoring and alerting.", //[cite: 1]
      "Optimized ingestion configurations and built a CLI client and REST API for dynamic configuration updates.", //[cite: 1]
      "Participated in production on-call, incident response, root-cause analysis, and corrective-action implementation for ingestion services." //[cite: 1]
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
