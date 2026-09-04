import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Target, Award, Globe, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GOAL_IMAGE_URL = 'https://miro.medium.com/v2/resize:fit:1200/1*GpyC3BaginCXOqaFP45EJw.jpeg';

const GoalCardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-[430px] max-h-[92vh] overflow-y-auto p-3.5 sm:p-4 rounded-2xl">
        <DialogHeader className="text-left pb-1 space-y-0.5">
          <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Personal Goal Card
            </span>
            <span className="text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Target 2026
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Stacked Cards: Front and Back - Identical Size & Aspect Ratio */}
        <div className="flex flex-col space-y-2.5 pt-1 w-full">
          {/* ======================================================== */}
          {/* FRONT VIEW (TOP) - aspect-[16/10]                         */}
          {/* ======================================================== */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              <span className="flex items-center gap-1 text-amber-400">
                <Globe className="w-3 h-3" />
                Front View
              </span>
              <span className="text-[10px] text-muted-foreground">Vision</span>
            </div>

            <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-amber-500/30 shadow-md bg-black flex flex-col justify-between group">
              {/* Background Image of World Landmarks & Globe */}
              <img
                src={GOAL_IMAGE_URL}
                alt="Personal Goal Card - World Landmarks & Globe"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Gradient Scrim for Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

              {/* Top Bar with Golden Emblem Seal */}
              <div className="relative z-10 p-2.5 sm:p-3 flex items-start justify-end">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-amber-500/25 backdrop-blur-md border border-amber-400/50 flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" />
                </div>
              </div>

              {/* Bottom Center Pill Badge */}
              <div className="relative z-10 p-2.5 sm:p-3 flex justify-center w-full">
                <div className="px-3.5 py-1 sm:py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-lg text-center">
                  <span className="text-[11px] sm:text-xs font-bold tracking-wider text-white uppercase drop-shadow-sm">
                    PERSONAL GOAL CARD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BACK VIEW (BOTTOM) - Exact Same aspect-[16/10]            */}
          {/* ======================================================== */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="w-3 h-3" />
                Back View
              </span>
              <span className="text-[10px] text-muted-foreground">Affirmation</span>
            </div>

            <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-amber-500/30 shadow-md bg-gradient-to-b from-card via-card/95 to-muted/40 p-3.5 sm:p-4 flex flex-col justify-between">
              {/* Subtle Ambient Glow */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              {/* Title Header */}
              <div className="relative z-10 text-center border-b border-border/60 pb-1.5 shrink-0">
                <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground font-serif">
                  Aspiration Goal Card
                </h3>
              </div>

              {/* Goal Statement Content */}
              <div className="relative z-10 space-y-2 text-foreground/90 my-auto py-1">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-400/90 block">
                    Target
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                    My Goal By end of 2026.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] sm:text-xs leading-relaxed text-foreground/95 font-medium">
                    I live outside India and earn{' '}
                    <span className="text-amber-400 font-bold underline decoration-amber-400/50 underline-offset-2">
                      1 crore plus
                    </span>{' '}
                    annually Consistently, doing what I love and helping people live a happy, Prosperous, and spiritual Lifestyle.
                  </p>
                </div>

                <div className="pt-1 border-t border-border/40">
                  <p className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-amber-300/90 italic">
                    "I promote the Golden Age."
                  </p>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="relative z-10 pt-1 border-t border-border/50 flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground shrink-0">
                <span>Global Aspirations</span>
                <span className="text-amber-400/90 font-mono font-semibold">✨ Target 2026</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalCardModal;
