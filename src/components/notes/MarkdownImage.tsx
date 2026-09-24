import React, { useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';

export interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // hast node from react-markdown; typed as any so propTypes remain compatible
  node?: any;
}

export const parseImageDimensions = (alt?: string, src?: string) => {
  let cleanAlt = alt || '';
  let width: string | undefined = undefined;
  let height: string | undefined = undefined;
  let align: 'left' | 'center' | 'right' | undefined = undefined;

  const parseSize = (spec: string): string | undefined => {
    let trimmed = spec.trim().toLowerCase();
    if (!trimmed) return undefined;

    trimmed = trimmed.replace(/^(width|w)\s*[:=]\s*/, '');

    if (trimmed === 'small') return '250px';
    if (trimmed === 'medium') return '500px';
    if (trimmed === 'large') return '750px';
    if (trimmed === 'full') return '100%';
    if (/^\d+$/.test(trimmed)) return `${trimmed}px`;
    if (/^\d+(\.\d+)?(px|%|rem|em|vw)$/.test(trimmed)) return trimmed;
    if (/^\d+x$/i.test(trimmed)) return `${trimmed.replace(/x$/i, '')}px`;

    return undefined;
  };

  // 1. Check alt string: e.g. "photo.png|300", "photo.png|50%", "photo.png|400x250", "photo.png|center|300", "300|photo.png"
  if (alt && alt.includes('|')) {
    const segments = alt.split('|').map((s) => s.trim());

    // Check if the first segment is actually a size (e.g. ![300|my-image])
    const firstSegmentSize = parseSize(segments[0]);
    if (firstSegmentSize && segments.length === 2 && !parseSize(segments[1])) {
      width = firstSegmentSize;
      cleanAlt = segments[1];
    } else {
      cleanAlt = segments[0];

      for (let i = 1; i < segments.length; i++) {
        const seg = segments[i].toLowerCase();
        if (seg === 'center' || seg === 'left' || seg === 'right') {
          align = seg as 'left' | 'center' | 'right';
        } else if (seg.includes('x') && !seg.endsWith('x')) {
          const [wPart, hPart] = seg.split('x');
          const parsedW = parseSize(wPart);
          const parsedH = parseSize(hPart);
          if (parsedW) width = parsedW;
          if (parsedH) height = parsedH;
        } else {
          const parsed = parseSize(seg);
          if (parsed) width = parsed;
        }
      }
    }
  } else if (alt) {
    // If entire alt is just a number/unit like ![300](url) or ![50%](url)
    const singleSize = parseSize(alt);
    if (singleSize) {
      width = singleSize;
      cleanAlt = '';
    }
  }

  // 2. Check URL hash / query fallback: e.g. url#width=400, url#400, url?w=400
  if (!width && src) {
    try {
      const urlObj = new URL(src, 'http://dummy.base');
      const hash = urlObj.hash.replace('#', '').trim();
      if (hash) {
        width = parseSize(hash);
      }
      if (!width) {
        const queryW = urlObj.searchParams.get('width') || urlObj.searchParams.get('w');
        if (queryW) width = parseSize(queryW);
      }
    } catch {
      // Ignore URL parsing errors for relative/malformed URLs
    }
  }

  return { cleanAlt, width, height, align };
};

export const MarkdownImage: React.FC<MarkdownImageProps> = ({
  src,
  alt,
  className = '',
  node: _node,
  style: userStyle,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const { cleanAlt, width, height, align } = parseImageDimensions(alt, src);

  if (!src) return null;

  if (hasError) {
    return (
      <span className="my-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive">
        <ImageOff className="w-4 h-4 shrink-0" />
        <span>Failed to load image: {cleanAlt || 'Untitled'}</span>
      </span>
    );
  }

  // Alignment container
  let alignmentClass = 'my-3 mx-auto flex flex-col items-center';
  if (align === 'left') alignmentClass = 'my-3 mr-auto flex flex-col items-start';
  if (align === 'right') alignmentClass = 'my-3 ml-auto flex flex-col items-end';

  return (
    <span
      className={`${alignmentClass} max-w-full text-center group relative clear-both`}
      style={{
        width: width ? '100%' : 'fit-content',
        maxWidth: width || '100%',
      }}
    >
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          width: width || 'auto',
          maxWidth: '100%',
          display: 'block',
        }}
        className="relative overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm hover:border-primary/50 transition-all cursor-zoom-in"
        title="Click to view full-resolution image"
      >
        <img
          src={src}
          alt={cleanAlt}
          loading="lazy"
          onError={() => setHasError(true)}
          style={{
            width: width || 'auto',
            maxWidth: '100%',
            height: height || 'auto',
            maxHeight: height ? undefined : '70vh',
            ...userStyle,
          }}
          className={`object-contain block mx-auto ${className}`}
          {...props}
        />
        <span className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded p-1 backdrop-blur-xs text-[10px] flex items-center gap-1 pointer-events-none">
          <ExternalLink className="w-3 h-3" />
        </span>
      </a>
      {cleanAlt && (
        <span className="block text-[11px] text-muted-foreground mt-1 text-center italic max-w-full truncate px-1">
          {cleanAlt}
        </span>
      )}
    </span>
  );
};

export default MarkdownImage;
