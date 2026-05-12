import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    cache: { dir: './node_modules/.vitest' },
  },
  server: {
    fs: { allow: ['.'] },
  },
});
