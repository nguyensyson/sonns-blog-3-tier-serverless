import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes all built asset paths relative, so the app works
// when uploaded to an S3 bucket without a fixed root domain/path.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './',
    plugins: [react()],
    server: {
      // Dev-only: forwards /api to whichever backend the developer points
      // at (e.g. a deployed dev API invoke URL, or `sam local start-api`).
      // Not used in the production build - the built app always calls
      // same-origin /api/* and relies on CloudFront to route it, so no
      // environment-specific URL is ever baked into the bundle. Set
      // VITE_DEV_API_PROXY_TARGET in frontend/.env.local to use this.
      proxy: env.VITE_DEV_API_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_DEV_API_PROXY_TARGET,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
  };
});
