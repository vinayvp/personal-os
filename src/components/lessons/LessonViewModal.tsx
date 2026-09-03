import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Quote, BookOpen, Calendar } from 'lucide-react';
import { getInstagramEmbedUrl } from './instagram';

interface Lesson {
  id: string;
  title: string;
  content: string;
  instagram_url?: string | null;
  created_at: string;
  lesson_categories?: { name: string; color: string } | null;
}

interface Props {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
}

const LessonViewModal: React.FC<Props> = ({ lesson, isOpen, onClose }) => {
  if (!lesson) return null;
  const isInstagram = Boolean(lesson.instagram_url);
  const embedUrl = lesson.instagram_url ? getInstagramEmbedUrl(lesson.instagram_url) : null;

  const formattedDate = new Date(lesson.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-h-[92vh] flex flex-col overflow-hidden p-5 sm:p-6 transition-all duration-200 ${
          isInstagram ? 'max-w-md' : 'max-w-lg sm:max-w-xl'
        }`}
      >
        <DialogHeader className="pr-6 space-y-2 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            {lesson.lesson_categories && (
              <Badge
                variant="secondary"
                className="px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${lesson.lesson_categories.color}20`,
                  color: lesson.lesson_categories.color,
                }}
              >
                {lesson.lesson_categories.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>

          <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
            {lesson.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-2">
          {/* Instagram Post View (Header & Footer Cropped, Pure Media with Natural Colors) */}
          {embedUrl ? (
            <div className="relative w-full aspect-[4/5] max-h-[480px] rounded-xl overflow-hidden border border-border/80 bg-black shadow-sm flex justify-center">
              <iframe
                src={embedUrl}
                title={lesson.title}
                className="w-full h-[620px]"
                style={{
                  border: 0,
                  display: 'block',
                  marginTop: '-54px',
                }}
                scrolling="no"
                allow="autoplay; encrypted-media; clipboard-write"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : lesson.instagram_url ? (
            <div className="p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground">
              Couldn't load Instagram preview.
            </div>
          ) : null}

          {/* Non-Instagram Text Content View */}
          {!isInstagram && lesson.content?.trim() && (
            <div className="relative rounded-xl border border-border/70 bg-gradient-to-b from-card/90 via-card/60 to-muted/20 p-6 sm:p-7 shadow-sm">
              <Quote className="h-7 w-7 text-primary/30 mb-3" />
              <p className="text-base sm:text-lg text-foreground leading-relaxed whitespace-pre-wrap font-normal">
                {lesson.content}
              </p>
            </div>
          )}

          {/* Supplementary Notes for Instagram Lessons */}
          {isInstagram && lesson.content?.trim() && (
            <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                Lesson Notes
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {lesson.content}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonViewModal;
