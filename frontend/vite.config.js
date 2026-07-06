import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes all built asset paths relative, so the app works
// when uploaded to an S3 bucket without a fixed root domain/path.
export default defineConfig({
  base: './',
  plugins: [react()],
});
