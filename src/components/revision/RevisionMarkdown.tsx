import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Checkbox } from '@/components/ui/checkbox';
import { MarkdownImage } from '@/components/notes/MarkdownImage';
import 'highlight.js/styles/github-dark.css';

interface RevisionMarkdownProps {
  content: string;
  className?: string;
}

export const RevisionMarkdown: React.FC<RevisionMarkdownProps> = ({ content, className = '' }) => {
  if (!content || !content.trim()) return null;

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none w-full min-w-0 break-words [overflow-wrap:anywhere] text-left ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children, ...props }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-foreground break-words" {...props}>{children}</h1>,
          h2: ({ children, ...props }) => <h2 className="text-lg font-semibold mb-2 mt-3 text-foreground break-words" {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 className="text-base font-semibold mb-2 mt-3 text-foreground break-words" {...props}>{children}</h3>,
          p: ({ children, ...props }) => <p className="mb-2.5 leading-relaxed text-sm md:text-base text-foreground/90 last:mb-0 break-words [overflow-wrap:anywhere]" {...props}>{children}</p>,
          ul: ({ children, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm md:text-base text-foreground/90 break-words" {...props}>{children}</ul>,
          ol: ({ children, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm md:text-base text-foreground/90 break-words" {...props}>{children}</ol>,
          li: ({ children, ...props }) => <li className="mb-0.5 leading-relaxed break-words [overflow-wrap:anywhere]" {...props}>{children}</li>,
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-primary/40 pl-3 italic my-3 bg-muted/40 py-1.5 rounded-r text-sm text-muted-foreground break-words max-w-full overflow-hidden" {...props}>
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <code className={`${className} block bg-muted/90 p-3 rounded-md overflow-x-auto max-w-full text-xs sm:text-sm font-mono my-2.5 text-foreground`} {...props}>
                {children}
              </code>
            ) : (
              <code className="bg-muted/80 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-primary font-medium border border-border/40 break-words [word-break:break-all]" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="bg-muted/90 p-3 rounded-md overflow-x-auto max-w-full mb-3 text-xs sm:text-sm border border-border/60" {...props}>
              {children}
            </pre>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto max-w-full my-3 border border-border rounded-md">
              <table className="border-collapse w-full min-w-full text-xs sm:text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-border px-3 py-1.5 bg-muted font-semibold text-left text-foreground" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-border px-3 py-1.5 text-foreground/90" {...props}>
              {children}
            </td>
          ),
          strong: ({ children, ...props }) => <strong className="font-semibold text-foreground" {...props}>{children}</strong>,
          em: ({ children, ...props }) => <em className="italic text-foreground/90" {...props}>{children}</em>,
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return <Checkbox checked={checked || false} className="mr-2 inline align-middle pointer-events-none" disabled />;
            }
            return <input type={type} checked={checked} {...props} />;
          },
          img: MarkdownImage
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default RevisionMarkdown;

