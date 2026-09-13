import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  CheckSquare,
  FileText,
  BookOpen,
  Film,
  DollarSign,
  Repeat,
  Briefcase,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenDetailedTutorial?: () => void;
}

interface AppInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const SUB_APPS: AppInfo[] = [
  {
    id: 'tracking',
    name: 'Habit Tracker',
    icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
    color: 'border-emerald-500/20 bg-emerald-500/5',
    description: 'Build daily habits, check off completions, and track your streaks over time.',
  },
  {
    id: 'todos',
    name: 'Todos',
    icon: <CheckSquare className="w-4 h-4 text-blue-500" />,
    color: 'border-blue-500/20 bg-blue-500/5',
    description: 'Organize tasks with priorities, categories, due dates, and completion filters.',
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: <FileText className="w-4 h-4 text-amber-500" />,
    color: 'border-amber-500/20 bg-amber-500/5',
    description: 'Write Markdown-supported notes with multi-tagging and quick note pinning.',
  },
  {
    id: 'lessons',
    name: 'Lessons Learned',
    icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
    color: 'border-indigo-500/20 bg-indigo-500/5',
    description: 'Document and categorize personal and career insights for ongoing reflection.',
  },
  {
    id: 'movies',
    name: 'Movies & TV',
    icon: <Film className="w-4 h-4 text-pink-500" />,
    color: 'border-pink-500/20 bg-pink-500/5',
    description: 'Manage watchlists, IMDb imports, streaming platforms, and personal ratings.',
  },
  {
    id: 'financial',
    name: 'Finance',
    icon: <DollarSign className="w-4 h-4 text-green-500" />,
    color: 'border-green-500/20 bg-green-500/5',
    description: 'Track investment portfolios, mutual fund SIPs, asset allocation, and valuations.',
  },
  {
    id: 'revision',
    name: 'Revision',
    icon: <Repeat className="w-4 h-4 text-purple-500" />,
    color: 'border-purple-500/20 bg-purple-500/5',
    description: 'Spaced repetition flashcards with automated retention schedules.',
  },
  {
    id: 'jobs',
    name: 'Job Tracker',
    icon: <Briefcase className="w-4 h-4 text-sky-500" />,
    color: 'border-sky-500/20 bg-sky-500/5',
    description: 'Full application pipeline with multi-source ATS score calculation and follow-ups.',
  },
];

export const GuestWelcomeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenDetailedTutorial,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium w-fit border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Guest Demo Mode
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Welcome to the Guest View!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            You are looking at a guest view with sample data. Feel free to interact, create, edit, and play around with all features—everything in this demo is completely isolated.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Explore All 8 Sub-Apps
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SUB_APPS.map((app) => (
              <div
                key={app.id}
                className={`p-3 rounded-lg border ${app.color} transition-all hover:shadow-sm`}
              >
                <div className="flex items-center gap-2 font-medium text-sm text-foreground mb-1">
                  {app.icon}
                  <span>{app.name}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {app.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-border/50">
          {onOpenDetailedTutorial ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                onOpenDetailedTutorial();
              }}
              className="gap-1.5 text-xs text-muted-foreground hover:text-primary justify-start sm:justify-center px-2"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              View In-Depth Tutorial Guide
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            onClick={onClose}
            className="gap-2 text-xs font-semibold h-9 px-5 shadow-sm"
          >
            Start Exploring Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

