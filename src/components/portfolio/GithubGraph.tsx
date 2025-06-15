
import React from 'react';
import GitHubCalendar from 'react-github-calendar';
import { Card } from '@/components/ui/card';

const GithubGraph = () => {
  const githubUsername = "aktech27";

  return (
    <section id="github" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Days I Code</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A snapshot of my coding activity from GitHub.
          </p>
        </div>
        <Card className="p-8 flex justify-center">
            <GitHubCalendar 
                username={githubUsername} 
                blockSize={15}
                blockMargin={5}
                fontSize={16}
                theme={{
                  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                  dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                }}
            />
        </Card>
      </div>
    </section>
  );
};

export default GithubGraph;
