import React, { useState, useEffect } from 'react';
import PageLoader from '@/components/common/PageLoader';
import RefreshButton from '@/components/common/RefreshButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RefreshCw, BookOpen, Filter, FolderPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreateLessonModal from './lessons/CreateLessonModal';
import CreateCategoryModal from './lessons/CreateCategoryModal';
import LessonCard from './lessons/LessonCard';
import LessonViewModal from './lessons/LessonViewModal';

interface Lesson {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  instagram_url: string | null;
  created_at: string;
  lesson_categories?: {
    name: string;
    color: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const LessonsApp = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [randomLessons, setRandomLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchLessons();
  }, []);

  useEffect(() => {
    if (lessons.length > 0) {
      generateRandomLessons();
    }
  }, [lessons]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive"
      });
    }
  };

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_categories (
            name,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lessons",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomLessons = () => {
    const shuffled = [...lessons].sort(() => 0.5 - Math.random());
    setRandomLessons(shuffled.slice(0, 6));
  };

  const filteredLessons = selectedCategory
    ? lessons.filter(lesson => lesson.category_id === selectedCategory)
    : lessons;

  const handleLessonCreated = () => {
    fetchLessons();
    setIsCreateModalOpen(false);
    toast({
      title: "Success",
      description: "Lesson created successfully"
    });
  };

  const handleCategoryCreated = () => {
    fetchCategories();
    setIsCreateCategoryModalOpen(false);
    toast({
      title: "Success",
      description: "Category created successfully"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Life Lessons</h1>
            <p className="text-muted-foreground">Capture and revisit your most important insights</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <RefreshButton onRefresh={async () => { await Promise.all([fetchLessons(), fetchCategories()]); }} />
            <Button 
              variant="outline" 
              onClick={() => setIsCreateCategoryModalOpen(true)} 
              className="gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Add Category
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Lesson
            </Button>
          </div>
        </div>

        <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Today's 6 Lessons
          </TabsTrigger>
          <TabsTrigger value="browse" className="gap-2">
            <Filter className="h-4 w-4" />
            Browse All
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Daily Wisdom</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateRandomLessons}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <PageLoader fullScreen={false} message="Loading lessons..." />
          ) : randomLessons.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No lessons yet. Create your first lesson to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {randomLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} onClick={() => setActiveLesson(lesson)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All ({lessons.length})
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                style={selectedCategory === category.id ? { backgroundColor: category.color } : {}}
              >
                {category.name} ({lessons.filter(l => l.category_id === category.id).length})
              </Button>
            ))}
          </div>

          {filteredLessons.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {selectedCategory ? "No lessons in this category yet." : "No lessons created yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {filteredLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} onClick={() => setActiveLesson(lesson)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateLessonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleLessonCreated}
        categories={categories}
      />

      <LessonViewModal
        lesson={activeLesson}
        isOpen={!!activeLesson}
        onClose={() => setActiveLesson(null)}
      />

      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
      />
      </div>
    </div>
  );
};

export default LessonsApp;