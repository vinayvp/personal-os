import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Instagram, Play } from 'lucide-react';
import { getInstagramShortcode } from './instagram';

interface Lesson {
  id: string;
  title: string;
  content: string;
  instagram_url?: string | null;
  created_at: string;
  lesson_categories?: { name: string; color: string } | null;
}

const LessonCard: React.FC<{ lesson: Lesson; onClick: () => void }> = ({ lesson, onClick }) => {
  const isInstagram = !!getInstagramShortcode(lesson.instagram_url || '');

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative aspect-[9/16] overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      {isInstagram ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/20">
          <div className="rounded-full bg-background/80 p-3 group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-primary" />
          </div>
          <Instagram className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : (
        <div className="absolute inset-0 p-3 overflow-hidden">
          <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap line-clamp-[14]">
            {lesson.content}
          </p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-background via-background/90 to-transparent">
        {lesson.lesson_categories && (
          <Badge
            variant="secondary"
            className="mb-1 text-[10px] px-1.5 py-0"
            style={{
              backgroundColor: `${lesson.lesson_categories.color}20`,
              color: lesson.lesson_categories.color,
            }}
          >
            {lesson.lesson_categories.name}
          </Badge>
        )}
        <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">{lesson.title}</p>
      </div>
    </Card>
  );
};

export default LessonCard;
