import React from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Code, List, ListOrdered, Heading2, Terminal, Eye, Edit3 } from 'lucide-react';

interface MarkdownToolbarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  value?: string;
  onChange?: (value: string) => void;
  activeTab?: 'edit' | 'preview';
  onTabChange?: (tab: 'edit' | 'preview') => void;
  className?: string;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  textareaRef,
  value = '',
  onChange,
  activeTab,
  onTabChange,
  className = '',
}) => {
  const applyFormat = (prefix: string, suffix = '', defaultText = '') => {
    if (!textareaRef?.current || !onChange) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentVal = textarea.value;

    const selectedText = currentVal.substring(start, end);
    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${defaultText}${suffix}`;

    const updated = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onChange(updated);

    // Reposition cursor and refocus
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + replacement.length
        : start + prefix.length + defaultText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className={`flex items-center justify-between gap-1 p-1 bg-muted/40 border rounded-md text-muted-foreground ${className}`}>
      <div className="flex items-center gap-0.5 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:text-foreground"
          onClick={() => applyFormat('**', '**', 'bold')}
          title="Bold (**text**)"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:text-foreground"
          onClick={() => applyFormat('*', '*', 'italic')}
          title="Italic (*text*)"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:text-foreground"
          onClick={() => applyFormat('`', '`', 'code')}
          title="Inline Code (`code`)"
        >
          <Code className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:text-foreground"
          onClick={() => applyFormat('```\n', '\n```', 'code block')}
          title="Code Block (```)"
        >
          <Terminal className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:text-foreground"
          onClick={() => applyFormat('- ', '', 'list item')}
          title="Bullet List (- item)"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:text-foreground"
          onClick={() => applyFormat('1. ', '', 'first item')}
          title="Numbered List (1. item)"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:text-foreground"
          onClick={() => applyFormat('### ', '', 'Heading')}
          title="Heading (###)"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {onTabChange && activeTab && (
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <Button
            type="button"
            variant={activeTab === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => onTabChange('edit')}
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </Button>
          <Button
            type="button"
            variant={activeTab === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => onTabChange('preview')}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarkdownToolbar;

