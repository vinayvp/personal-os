import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Instagram, Play, Quote } from 'lucide-react';
import { getInstagramShortcode } from './instagram';

interface Lesson {
  id: string;
  title: string;
  content: string;
  instagram_url?: string | null;
  created_at: string;
  lesson_categories?: { name: string; color: string } | null;
}

const getTextSize = (length: number) => {
  if (length <= 40) return { size: 'text-lg sm:text-2xl', clamp: 'line-clamp-6' };
  if (length <= 90) return { size: 'text-base sm:text-xl', clamp: 'line-clamp-[8]' };
  if (length <= 160) return { size: 'text-sm sm:text-lg', clamp: 'line-clamp-[10]' };
  if (length <= 280) return { size: 'text-xs sm:text-base', clamp: 'line-clamp-[12]' };
  return { size: 'text-[11px] sm:text-sm', clamp: 'line-clamp-[14]' };
};

const LessonCard: React.FC<{ lesson: Lesson; onClick: () => void }> = ({ lesson, onClick }) => {
  const isInstagram = !!getInstagramShortcode(lesson.instagram_url || '');
  const textSize = getTextSize((lesson.content || '').trim().length);

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
        <div className="absolute inset-0 flex items-center justify-center p-4 pb-14 bg-gradient-to-br from-secondary/40 via-background to-accent/20 overflow-hidden">
          <Quote className="absolute top-3 left-3 h-4 w-4 text-primary/25" />
          <p
            className={`text-center font-medium leading-snug text-foreground whitespace-pre-wrap ${textSize.size} ${textSize.clamp}`}
          >
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
