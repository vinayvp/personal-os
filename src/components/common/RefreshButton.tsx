import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onRefresh: () => void | Promise<unknown>;
  label?: string;
  /** Show only the icon (default true) */
  iconOnly?: boolean;
  className?: string;
}

/** Consistent per-page refresh control that reloads only that page's data. */
const RefreshButton = ({ onRefresh, label = 'Refresh', iconOnly = true, className }: RefreshButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size={iconOnly ? 'icon' : 'sm'}
      onClick={handleClick}
      disabled={isRefreshing}
      aria-label={label}
      title={label}
      className={cn(iconOnly ? 'h-8 w-8 shrink-0' : 'gap-2', className)}
    >
      <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
      {!iconOnly && label}
    </Button>
  );
};

export default RefreshButton;
