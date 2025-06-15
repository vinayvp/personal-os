
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotesApp from '@/components/NotesApp';
import TrackingApp from '@/components/TrackingApp';

const Apps = () => {
  const [selectedApp, setSelectedApp] = React.useState<string | null>(null);

  if (selectedApp === 'notes') {
    return <NotesApp />;
  }

  if (selectedApp === 'tracking') {
    return <TrackingApp />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your App</h1>
          <p className="text-xl text-gray-600">Select an application to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Notes App</CardTitle>
              <CardDescription>
                Create, edit, and organize your notes with markdown support and tagging
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setSelectedApp('notes')}
                className="w-full"
              >
                Open Notes App
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Daily Tracker</CardTitle>
              <CardDescription>
                Track your daily habits and activities with calendar view
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setSelectedApp('tracking')}
                className="w-full"
                variant="outline"
              >
                Open Tracker
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Analytics</CardTitle>
              <CardDescription>
                View insights and analytics from your tracked data
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button disabled className="w-full" variant="outline">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Link to="/">
            <Button variant="ghost">← Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Apps;
