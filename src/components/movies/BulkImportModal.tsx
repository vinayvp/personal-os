import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, AlertCircle, CheckCircle, X, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { extractImdbId } from "./AddMovieModal";

interface Movie {
  id: string;
  title: string;
  release_year: string;
  genre: string;
  custom_category: string | null;
  imdb_score: string;
  rotten_tomatoes_rating: string;
  rated: string;
  poster_url: string;
  plot: string;
  watched: boolean;
  created_at: string;
  updated_at: string;
}

interface BulkImportItem {
  title: string;
  custom_category?: string;
}

interface ProcessedItem {
  title: string;
  custom_category?: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'duplicate';
  error?: string;
  movie?: Movie;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoviesAdded: (movies: Movie[]) => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onMoviesAdded
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/json') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JSON file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        if (!Array.isArray(jsonData)) {
          throw new Error("JSON must be an array");
        }

        const processedItems: ProcessedItem[] = jsonData.map((item: any) => {
          if (!item.title || typeof item.title !== 'string') {
            return {
              title: item.title || 'Unknown',
              custom_category: item.custom_category,
              status: 'error' as const,
              error: 'Missing or invalid title'
            };
          }
          
          return {
            title: item.title,
            custom_category: item.custom_category,
            status: 'pending' as const
          };
        });

        setItems(processedItems);
        
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please check your JSON file format.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(selectedFile);
  };

  const searchOMDb = async (title: string): Promise<any> => {
    const isImdb = /imdb\.com\/title\/tt\d+/i.test(title) || /^tt\d{6,10}$/i.test(title.trim());
    const imdbId = isImdb ? extractImdbId(title) : null;
    const body = imdbId ? { imdbId } : { title };
    const { data, error } = await supabase.functions.invoke('search-movie', {
      body
    });

    if (error) {
      throw new Error('Failed to search movie');
    }

    if (!data) {
      throw new Error('Movie not found');
    }

    return data;
  };

  const checkDuplicate = async (title: string, year: string): Promise<boolean> => {
    const { data } = await supabase
      .from('movies_tv')
      .select('id')
      .eq('title', title)
      .eq('release_year', year);

    return (data && data.length > 0) || false;
  };

  const createCategory = async (categoryName: string) => {
    if (!categoryName.trim()) return;
    
    await supabase
      .from('movies_categories')
      .upsert({ name: categoryName.trim() });
  };

  const processItems = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);

    const validItems = items.filter(item => item.status !== 'error');
    const addedMovies: Movie[] = [];

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      
      // Update status to processing
      setItems(prev => prev.map(prevItem => 
        prevItem.title === item.title && prevItem.custom_category === item.custom_category 
          ? { ...prevItem, status: 'processing' }
          : prevItem
      ));

      try {
        // Search OMDB
        const omdbData = await searchOMDb(item.title);
        
        // Check for duplicates
        const isDuplicate = await checkDuplicate(omdbData.title, omdbData.release_year);
        
        if (isDuplicate) {
          setItems(prev => prev.map(prevItem => 
            prevItem.title === item.title && prevItem.custom_category === item.custom_category 
              ? { ...prevItem, status: 'duplicate', error: 'Already exists in collection' }
              : prevItem
          ));
          continue;
        }

        // Create custom category if provided
        if (item.custom_category) {
          await createCategory(item.custom_category);
        }

        // Add movie to database
        const movieData = {
          title: omdbData.title,
          release_year: omdbData.release_year,
          genre: omdbData.genre,
          custom_category: item.custom_category || null,
          imdb_score: omdbData.imdb_score,
          rotten_tomatoes_rating: omdbData.rotten_tomatoes_rating,
          rated: omdbData.rated,
          poster_url: omdbData.poster_url || '',
          plot: omdbData.plot,
          watched: false
        };

        const { data: newMovie, error } = await supabase
          .from('movies_tv')
          .insert(movieData)
          .select()
          .single();

        if (error) throw error;

        addedMovies.push(newMovie);
        
        setItems(prev => prev.map(prevItem => 
          prevItem.title === item.title && prevItem.custom_category === item.custom_category 
            ? { ...prevItem, status: 'success', movie: newMovie }
            : prevItem
        ));

      } catch (error) {
        setItems(prev => prev.map(prevItem => 
          prevItem.title === item.title && prevItem.custom_category === item.custom_category 
            ? { ...prevItem, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
            : prevItem
        ));
      }

      setProcessedCount(i + 1);
      setProgress(((i + 1) / validItems.length) * 100);
    }

    setIsProcessing(false);
    
    if (addedMovies.length > 0) {
      onMoviesAdded(addedMovies);
      toast({
        title: "Bulk Import Complete",
        description: `Successfully added ${addedMovies.length} movies/TV shows.`,
      });
    }
  };

  const parseJsonContent = (content: string) => {
    try {
      const jsonData = JSON.parse(content);
      
      if (!Array.isArray(jsonData)) {
        throw new Error("JSON must be an array");
      }

      const processedItems: ProcessedItem[] = jsonData.map((item: any) => {
        if (!item.title || typeof item.title !== 'string') {
          return {
            title: item.title || 'Unknown',
            custom_category: item.custom_category,
            status: 'error' as const,
            error: 'Missing or invalid title'
          };
        }
        
        return {
          title: item.title,
          custom_category: item.custom_category,
          status: 'pending' as const
        };
      });

      setItems(processedItems);
      return true;
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleJsonTextSubmit = () => {
    if (!jsonText.trim()) {
      toast({
        title: "Empty Input",
        description: "Please paste JSON content.",
        variant: "destructive",
      });
      return;
    }
    parseJsonContent(jsonText);
  };

  const handleClose = () => {
    setFile(null);
    setJsonText('');
    setInputMode('file');
    setItems([]);
    setIsProcessing(false);
    setProgress(0);
    setProcessedCount(0);
    onClose();
  };

  const getStatusIcon = (status: ProcessedItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'error':
      case 'duplicate':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 border border-muted-foreground rounded-full" />;
    }
  };

  const successCount = items.filter(item => item.status === 'success').length;
  const errorCount = items.filter(item => item.status === 'error').length;
  const duplicateCount = items.filter(item => item.status === 'duplicate').length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Movies/TV Shows</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section - File or Text */}
          {items.length === 0 && (
            <div className="space-y-4">
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'file' | 'text')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Paste JSON
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="file" className="space-y-4">
                  <div>
                    <Label htmlFor="json-file">Upload JSON File</Label>
                    <Input
                      id="json-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="json-text">Paste JSON Content</Label>
                    <Textarea
                      id="json-text"
                      placeholder={`[
  {
    "title": "The Matrix",
    "custom_category": "Sci-Fi Favorites"
  }
]`}
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      className="mt-2 font-mono text-xs min-h-[150px]"
                    />
                  </div>
                  <Button onClick={handleJsonTextSubmit} className="w-full">
                    Parse JSON
                  </Button>
                </TabsContent>
              </Tabs>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Expected JSON Format:</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`[
  {
    "title": "The Matrix",
    "custom_category": "Sci-Fi Favorites"
  },
  {
    "title": "https://www.imdb.com/title/tt1375666/",
    "custom_category": "Mind Benders"
  }
]`}
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: <span className="font-mono">title</span> can be a movie name, an IMDb ID (e.g. <span className="font-mono">tt0804484</span>), or an IMDb URL.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview and Processing Section */}
          {items.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {file ? `Preview: ${file.name}` : 'Preview: Pasted JSON'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {items.length} items found
                    {successCount > 0 && ` • ${successCount} successful`}
                    {errorCount > 0 && ` • ${errorCount} errors`}
                    {duplicateCount > 0 && ` • ${duplicateCount} duplicates`}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setJsonText('');
                    setItems([]);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{processedCount}/{items.filter(item => item.status !== 'error').length}</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <div className="max-h-96 overflow-y-auto space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      {item.custom_category && (
                        <div className="text-xs text-muted-foreground">
                          Category: {item.custom_category}
                        </div>
                      )}
                      {item.error && (
                        <div className="text-xs text-destructive mt-1">{item.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button 
                  onClick={processItems} 
                  disabled={isProcessing || items.filter(item => item.status === 'pending').length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Start Import'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportModal;