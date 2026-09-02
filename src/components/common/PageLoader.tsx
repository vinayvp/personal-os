import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  message?: string;
  /** Fill the viewport (default) or just inline space */
  fullScreen?: boolean;
  className?: string;
}

/** Consistent loading indicator used across every sub-app. */
const PageLoader = ({ message = 'Loading...', fullScreen = true, className }: PageLoaderProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-background',
        fullScreen ? 'min-h-screen' : 'py-16',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;
