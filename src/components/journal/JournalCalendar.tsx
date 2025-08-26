import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JournalEntry } from '../JournalApp';

interface JournalCalendarProps {
  entries: JournalEntry[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const JournalCalendar = ({ entries, selectedDate, onDateSelect }: JournalCalendarProps) => {
  // Create a set of dates that have entries
  const datesWithEntries = new Set(
    entries.map(entry => entry.date)
  );

  // Get entry for selected date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedEntry = entries.find(entry => entry.date === selectedDateStr);

  const modifiers = {
    hasEntry: (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return datesWithEntries.has(dateStr);
    },
  };

  const modifiersStyles = {
    hasEntry: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '6px',
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Journal Calendar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on any date to create or edit an entry. Highlighted dates have existing entries.
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateSelect(date)}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
              showOutsideDays={false}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEntry ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedEntry.word_count} words
                  </span>
                  {selectedEntry.mood && (
                    <span className="text-2xl">{selectedEntry.mood}</span>
                  )}
                </div>
                
                {selectedEntry.content && (
                  <p className="text-sm line-clamp-4">
                    {selectedEntry.content}
                  </p>
                )}

                {selectedEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedEntry.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(selectedEntry.updated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No entry for this date</p>
                <p className="text-sm text-muted-foreground">
                  Click "Today's Entry" or select this date to create one
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Entries:</span>
              <span className="font-medium">{entries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">This Month:</span>
              <span className="font-medium">
                {entries.filter(entry => {
                  const entryDate = new Date(entry.date);
                  const now = new Date();
                  return entryDate.getMonth() === now.getMonth() && 
                         entryDate.getFullYear() === now.getFullYear();
                }).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Words:</span>
              <span className="font-medium">
                {entries.reduce((sum, entry) => sum + (entry.word_count || 0), 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JournalCalendar;