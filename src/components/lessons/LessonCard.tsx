import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Instagram, Quote, ChevronRight } from 'lucide-react';
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
  const isInstagram = Boolean(getInstagramShortcode(lesson.instagram_url || ''));

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
      className="group relative overflow-hidden cursor-pointer border border-border/70 hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-3.5 sm:p-4 bg-card/80 hover:bg-card flex items-center gap-3 sm:gap-3.5 min-h-[82px]"
    >
      {/* Background Accent Subtle Glow */}
      {isInstagram ? (
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Left Icon Badge */}
      <div className="relative z-10 shrink-0">
        {isInstagram ? (
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-rose-500/30 text-rose-400 group-hover:scale-105 transition-transform">
            <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        ) : (
          <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
            <Quote className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
      </div>

      {/* Middle: Category & Title */}
      <div className="relative z-10 flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          {lesson.lesson_categories && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
              style={{
                backgroundColor: `${lesson.lesson_categories.color}20`,
                color: lesson.lesson_categories.color,
              }}
            >
              {lesson.lesson_categories.name}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">
            {isInstagram ? 'Instagram' : 'Lesson'}
          </span>
        </div>

        <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {lesson.title}
        </h3>
      </div>

      {/* Right Action Chevron */}
      <div className="relative z-10 shrink-0 pl-1 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">
        <ChevronRight className="h-4 w-4" />
      </div>
    </Card>
  );
};

export default LessonCard;
