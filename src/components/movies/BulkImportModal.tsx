import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    const { data, error } = await supabase.functions.invoke('search-movie', {
      body: { title }
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

  const handleClose = () => {
    setFile(null);
    setItems([]);
    setIsProcessing(false);
    setProgress(0);
    setProcessedCount(0);
    onClose();
  };

  const getStatusIcon = (status: ProcessedItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
      case 'duplicate':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 border border-gray-300 rounded-full" />;
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
          {/* File Upload Section */}
          {!file && (
            <div className="space-y-4">
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
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Expected JSON Format:</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`[
  {
    "title": "The Matrix",
    "custom_category": "Sci-Fi Favorites"
  },
  {
    "title": "Inception",
    "custom_category": "Mind Benders"
  }
]`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview and Processing Section */}
          {file && items.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Preview: {file.name}</h3>
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
                        <div className="text-xs text-red-500 mt-1">{item.error}</div>
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