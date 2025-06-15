
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, ExternalLink } from 'lucide-react';

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

const Projects = () => {
  return (
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
            <Card key={index} className="group hover:scale-105 transition-all duration-300">
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300 flex-1">
                    {project.title}
                  </h3>
                  <div className="flex gap-2 ml-4">
                    {project.github && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={project.github} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {project.live && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                         <a href={project.live} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
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
  );
};

export default Projects;
