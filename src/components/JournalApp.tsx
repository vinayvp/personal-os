import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, BarChart3, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import JournalCalendar from './journal/JournalCalendar';
import JournalTimeline from './journal/JournalTimeline';
import JournalEditor from './journal/JournalEditor';
import JournalStats from './journal/JournalStats';
import JournalAuthGuard from './JournalAuthGuard';

export interface JournalEntry {
  id: string;
  date: string;
  content?: string;
  rich_content?: any;
  tags: string[];
  mood?: string;
  attachments: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
}

const JournalApp = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load journal entries.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const existingEntry = entries.find(entry => entry.date === dateStr);
    if (existingEntry) {
      setEditingEntry(existingEntry);
    } else {
      // Create new entry for this date
      const newEntry: Partial<JournalEntry> = {
        date: dateStr,
        content: '',
        tags: [],
        attachments: [],
        word_count: 0,
      };
      setEditingEntry(newEntry as JournalEntry);
    }
  };

  const handleTodayEntry = () => {
    const today = new Date();
    handleDateSelect(today);
  };

  const handleEntrySaved = (savedEntry: JournalEntry) => {
    setEntries(prev => {
      const existingIndex = prev.findIndex(entry => entry.id === savedEntry.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = savedEntry;
        return updated;
      } else {
        return [savedEntry, ...prev];
      }
    });
    setEditingEntry(null);
    toast({
      title: "Entry saved",
      description: "Your journal entry has been saved successfully.",
    });
  };

  const handleEntryDeleted = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
    setEditingEntry(null);
    toast({
      title: "Entry deleted",
      description: "Journal entry has been deleted.",
    });
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.content?.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
      entry.mood?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <JournalAuthGuard>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Personal Journal</h1>
            <Button onClick={handleTodayEntry} className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today's Entry
            </Button>
          </div>

          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <JournalCalendar
                entries={entries}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </TabsContent>

            <TabsContent value="timeline">
              <JournalTimeline
                entries={entries}
                onEditEntry={setEditingEntry}
              />
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries by content, tags, or mood..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEntries.map(entry => (
                  <Card
                    key={entry.id}
                    className="cursor-pointer transition-colors hover:bg-accent"
                    onClick={() => setEditingEntry(entry)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                        {entry.mood && <span className="text-2xl">{entry.mood}</span>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {entry.content && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          {entry.content.length > 150 
                            ? entry.content.substring(0, 150) + '...' 
                            : entry.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{entry.word_count} words</span>
                        <span>{entry.tags.length} tags</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredEntries.length === 0 && searchQuery && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No entries found
                    </h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <JournalStats entries={entries} />
            </TabsContent>
          </Tabs>

          {/* Journal Editor Modal/Sheet */}
          {editingEntry && (
            <JournalEditor
              entry={editingEntry}
              onSave={handleEntrySaved}
              onDelete={handleEntryDeleted}
              onClose={() => setEditingEntry(null)}
            />
          )}
        </div>
      </div>
    </JournalAuthGuard>
  );
};

export default JournalApp;