import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, PanelLeftClose, PanelLeftOpen, Hash } from 'lucide-react';

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extracts headings (# through ######) from raw markdown text,
 * safely ignoring code blocks (``` and ~~~).
 */
export const extractHeadings = (markdown: string): HeadingItem[] => {
  if (!markdown) return [];

  // Remove fenced code blocks to prevent code comments (# ...) from being treated as headings
  const cleanMd = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '');

  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: HeadingItem[] = [];
  const slugCounts: Record<string, number> = {};

  let match;
  while ((match = headingRegex.exec(cleanMd)) !== null) {
    const level = match[1].length;
    let text = match[2].trim();

    // Strip trailing # if any (e.g. ## Heading ##)
    text = text.replace(/\s+#+$/, '');
    // Strip markdown formatting (bold, italic, links, code)
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    text = text.replace(/[*_~`]/g, '');

    if (!text) continue;

    let slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    if (!slug) slug = `heading-${headings.length + 1}`;

    if (slugCounts[slug] !== undefined) {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 0;
    }

    headings.push({ id: slug, text, level });
  }

  return headings;
};

/**
 * Extracts raw string text from React children.
 */
export const getNodeText = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (React.isValidElement(node) && node.props && (node.props as Record<string, unknown>).children) {
    return getNodeText((node.props as { children: React.ReactNode }).children);
  }
  return '';
};

/**
 * Creates an element ID for a heading given its text.
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

interface NoteHeadingsOutlineProps {
  headings: HeadingItem[];
  isOpen: boolean;
  onToggle: () => void;
  activeId?: string;
  onHeadingClick?: (id: string) => void;
  className?: string;
}

export const NoteHeadingsOutline: React.FC<NoteHeadingsOutlineProps> = ({
  headings,
  isOpen,
  onToggle,
  activeId,
  onHeadingClick,
  className = '',
}) => {
  const handleScrollTo = (id: string) => {
    onHeadingClick?.(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // If collapsed: show slim icon rail
  if (!isOpen) {
    return (
      <div
        className={`w-10 sm:w-11 shrink-0 border-r border-border/60 bg-muted/20 flex flex-col items-center py-3 select-none transition-all ${className}`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          title={`Show Headings (${headings.length} found)`}
        >
          <PanelLeftOpen className="w-4 h-4" />
        </Button>

        {headings.length > 0 && (
          <div
            onClick={onToggle}
            className="mt-4 flex flex-col items-center gap-1 cursor-pointer group"
            title={`${headings.length} headings available. Click to expand.`}
          >
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              {headings.length}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 [writing-mode:vertical-rl] group-hover:text-foreground transition-colors pt-2">
              Outline
            </span>
          </div>
        )}
      </div>
    );
  }

  // If expanded: show full outline sidebar
  return (
    <aside
      className={`w-56 sm:w-60 md:w-64 shrink-0 border-r border-border/60 bg-card/60 flex flex-col select-none transition-all ${className}`}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between shrink-0 bg-muted/30">
        <div className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold tracking-tight text-foreground">
            Headings
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground border border-border/50 font-medium">
            {headings.length}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Collapse headings sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

      {/* Headings List */}
      <ScrollArea className="flex-1 p-2">
        {headings.length === 0 ? (
          <div className="p-4 text-center space-y-1.5">
            <Hash className="w-5 h-5 mx-auto text-muted-foreground/40" />
            <p className="text-xs font-medium text-muted-foreground">
              No headings found
            </p>
            <p className="text-[10.5px] text-muted-foreground/70 leading-relaxed">
              Use <code className="text-[10px] bg-muted px-1 py-0.5 rounded"># Heading</code> in Markdown to generate an outline.
            </p>
          </div>
        ) : (
          <nav className="space-y-0.5 py-1">
            {headings.map((heading) => {
              const isActive = activeId === heading.id;

              // Compute hierarchical indentation and style
              let indentClass = 'pl-2 text-xs font-medium text-foreground';
              if (heading.level === 2) {
                indentClass = 'pl-4 text-[11.5px] text-foreground/85 border-l border-border/50 ml-1.5';
              } else if (heading.level === 3) {
                indentClass = 'pl-6 text-[11px] text-muted-foreground border-l border-border/40 ml-1.5';
              } else if (heading.level >= 4) {
                indentClass = 'pl-8 text-[10.5px] text-muted-foreground/75 border-l border-border/30 ml-1.5';
              }

              return (
                <button
                  key={heading.id}
                  type="button"
                  onClick={() => handleScrollTo(heading.id)}
                  title={heading.text}
                  className={`w-full text-left py-1.5 pr-2 rounded-md transition-all flex items-center justify-between group ${indentClass} ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold border-primary ring-1 ring-primary/20'
                      : 'hover:bg-accent/60 hover:text-accent-foreground'
                  }`}
                >
                  <span className="truncate flex-1">{heading.text}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    H{heading.level}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </ScrollArea>
    </aside>
  );
};

export default NoteHeadingsOutline;

