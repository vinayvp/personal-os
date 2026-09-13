import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  CheckSquare,
  TrendingUp,
  FileText,
  Film,
  DollarSign,
  Repeat,
  Briefcase,
  Lightbulb,
  Sparkles,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { SUBAPP_TUTORIALS, SubappTutorial } from './tutorialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultAppId?: string;
}

const APP_ICONS: Record<string, React.ReactNode> = {
  tracking: <TrendingUp className="w-4 h-4" />,
  todos: <CheckSquare className="w-4 h-4" />,
  notes: <FileText className="w-4 h-4" />,
  lessons: <BookOpen className="w-4 h-4" />,
  movies: <Film className="w-4 h-4" />,
  financial: <DollarSign className="w-4 h-4" />,
  revision: <Repeat className="w-4 h-4" />,
  jobs: <Briefcase className="w-4 h-4" />,
};

export const SubappTutorialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultAppId = 'tracking',
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(defaultAppId);

  useEffect(() => {
    if (defaultAppId && SUBAPP_TUTORIALS[defaultAppId]) {
      setSelectedAppId(defaultAppId);
    }
  }, [defaultAppId, isOpen]);

  const tutorial: SubappTutorial = SUBAPP_TUTORIALS[selectedAppId] || SUBAPP_TUTORIALS.tracking;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border">
        {/* Header with gradient badge */}
        <DialogHeader className="p-5 pb-4 border-b border-border/70 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  Sub-App User Guide
                  <Badge variant="secondary" className="text-[10px] font-mono font-medium px-2 py-0.5">
                    Tutorial
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Learn key workflows, capabilities, and pro-tips for each application.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Sub-app Quick Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
            {Object.values(SUBAPP_TUTORIALS).map((item) => {
              const isSelected = item.id === selectedAppId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAppId(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60'
                  }`}
                >
                  {APP_ICONS[item.id]}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-5 overflow-y-auto max-h-[calc(85vh-160px)]">
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* App Overview Banner */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-primary/15 text-primary">
                  {APP_ICONS[tutorial.id]}
                </span>
                <h3 className="font-semibold text-sm sm:text-base text-foreground">
                  {tutorial.name}
                </h3>
              </div>
              <p className="text-xs font-medium text-primary/90 italic">
                "{tutorial.tagline}"
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tutorial.overview}
              </p>
            </div>

            {/* Step-by-Step Sections */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Step-by-Step Walkthrough
              </h4>

              <div className="space-y-3">
                {tutorial.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card/90 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-semibold text-xs sm:text-sm text-foreground">
                        {sec.title}
                      </h5>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {sec.description}
                    </p>

                    {sec.steps && sec.steps.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {sec.steps.map((st, sIdx) => (
                          <li
                            key={sIdx}
                            className="text-xs text-foreground/90 flex items-start gap-2 leading-relaxed"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tips Section */}
            {tutorial.proTips && tutorial.proTips.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>Pro Tips & Best Practices</span>
                </div>
                <ul className="space-y-1.5">
                  {tutorial.proTips.map((tip, tIdx) => (
                    <li
                      key={tIdx}
                      className="text-xs text-foreground/90 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/70 bg-muted/20 shrink-0 flex items-center justify-between sm:justify-between w-full">
          <div className="text-[11px] text-muted-foreground hidden sm:block">
            Tip: You can reopen this guide anytime from the top bar.
          </div>
          <Button type="button" size="sm" onClick={onClose} className="text-xs">
            Got It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

