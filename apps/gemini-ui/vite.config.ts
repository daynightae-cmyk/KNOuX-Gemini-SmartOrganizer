import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Build-only CSP. The Electron main process also adds a response header in the
// packaged application; keeping this out of the dev server avoids weakening the
// HMR workflow while ensuring every distributable build has a policy.
// `frame-ancestors` is deliberately absent: browsers ignore it in a meta tag,
// and the Electron main process already sends it as a response header. Fonts
// are self-hosted now, so the policy no longer opens a Google Fonts origin.
const BUILD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "worker-src 'self' blob:",
].join('; ');

const cspPlugin = {
  name: 'knoux-build-csp',
  apply: 'build' as const,
  transformIndexHtml(html: string) {
    return html.replace(
      '</head>',
      `  <meta http-equiv="Content-Security-Policy" content="${BUILD_CSP}" />\n  </head>`
    );
  },
};

export default defineConfig(() => {
  return {
    // File-protocol friendly assets for the Electron package; the HTTP preview
    // resolves these identically.
    base: './',
    plugins: [react(), tailwindcss(), cspPlugin],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
