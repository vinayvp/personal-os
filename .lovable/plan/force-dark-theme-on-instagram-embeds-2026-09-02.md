# Force Dark Theme on Instagram Embeds

## Goal
Make all Instagram lesson embeds render in Instagram's dark theme to match the app's dark UI.

## Current State
Instagram embed URLs are built in `src/components/lessons/instagram.ts` as:
```text
https://www.instagram.com/p/{shortcode}/embed
```
Instagram supports a `theme=dark` query parameter on this endpoint.

## Changes
1. Update `getInstagramEmbedUrl` in `src/components/lessons/instagram.ts` to append `?theme=dark` to the generated embed URL.
2. Run a TypeScript type check to confirm no regressions.

## Acceptance Criteria
- Opening an Instagram lesson in the modal renders the embedded post with Instagram's dark theme.
- Existing embed behavior (shortcode extraction, direct link fallback) remains unchanged.
