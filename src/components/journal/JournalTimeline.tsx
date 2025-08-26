import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Calendar } from 'lucide-react';
import { JournalEntry } from '../JournalApp';

interface JournalTimelineProps {
  entries: JournalEntry[];
  onEditEntry: (entry: JournalEntry) => void;
}

const JournalTimeline = ({ entries, onEditEntry }: JournalTimelineProps) => {
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No journal entries yet
          </h3>
          <p className="text-muted-foreground">
            Start your journaling journey by creating your first entry.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Journal Timeline</h2>
        <p className="text-muted-foreground">
          All your entries in chronological order
        </p>
      </div>

      <div className="space-y-4">
        {sortedEntries.map((entry, index) => (
          <Card key={entry.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {entry.mood && <span className="text-xl ml-2">{entry.mood}</span>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {entry.word_count} words • Last updated: {new Date(entry.updated_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditEntry(entry)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {entry.content && (
                <div className="mb-4">
                  <p className="text-sm leading-relaxed">
                    {entry.content.length > 300 
                      ? entry.content.substring(0, 300) + '...' 
                      : entry.content}
                  </p>
                </div>
              )}

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {entry.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {entry.attachments.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  📎 {entry.attachments.length} attachment{entry.attachments.length > 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedEntries.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            You've reached the beginning of your journal
          </p>
        </div>
      )}
    </div>
  );
};

export default JournalTimeline;