// Extracts the shortcode from an Instagram post/reel/tv URL
export const getInstagramShortcode = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
};

export const getInstagramEmbedUrl = (url: string): string | null => {
  const code = getInstagramShortcode(url);
  return code ? `https://www.instagram.com/p/${code}/embed` : null;
};
