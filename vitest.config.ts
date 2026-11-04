import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // database test files share one test database, so run files one at a time
  test: { include: ['tests/**/*.test.ts'], fileParallelism: false },
});
