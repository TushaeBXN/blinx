// @polsia:user-owned — brand identity. Edit freely. `site.ts` re-exports
// siteName/siteDescription; `manifest.ts` + `opengraph-image.tsx` read `brandVisual`.

export const siteName = 'Blinx';
export const siteDescription =
  'A full-stack AI workforce for nonprofit teams — replace six disconnected tools with one platform where specialized agents and operating modules share a single source of truth.';

// PWA + social-share colors. HEX only (the oklch() tokens in globals.css aren't
// readable here) — set to match your brand seed (teal hue ~165, lightness 0.52).
export const brandVisual = {
  /** PWA browser-UI / status-bar color. */
  themeColor: '#0f4a45',
  /** PWA splash + install background. */
  backgroundColor: '#0b1d1b',
  /** Social-share (OG/Twitter) image. */
  og: {
    background: '#0b1d1b',
    foreground: '#e8f5f3',
    /** Second line under the site name; '' hides it. */
    tagline: 'A full-stack AI workforce for nonprofit teams.',
  },
} as const;
