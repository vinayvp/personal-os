import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Instagram } from 'lucide-react';
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
  const embedUrl = lesson.instagram_url ? getInstagramEmbedUrl(lesson.instagram_url) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[92vh] flex flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-base sm:text-lg text-left">{lesson.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {lesson.lesson_categories && (
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `${lesson.lesson_categories.color}20`,
                color: lesson.lesson_categories.color,
              }}
            >
              {lesson.lesson_categories.name}
            </Badge>
          )}

          {embedUrl ? (
            <div className="rounded-lg overflow-hidden border border-border bg-card">
              <iframe
                src={embedUrl}
                title={lesson.title}
                className="w-full"
                style={{ height: '70vh', border: 0 }}
                allow="autoplay; encrypted-media; clipboard-write"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : lesson.instagram_url ? (
            <div className="text-sm text-muted-foreground">
              Couldn't read that Instagram link. Open it directly below.
            </div>
          ) : null}

          {lesson.content?.trim() && (
            <p className="text-sm text-foreground whitespace-pre-wrap">{lesson.content}</p>
          )}

          {lesson.instagram_url && (
            <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
              <a href={lesson.instagram_url} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" />
                Open on Instagram
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Created {new Date(lesson.created_at).toLocaleDateString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonViewModal;
