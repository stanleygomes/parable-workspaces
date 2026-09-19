import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  test: {
    name: 'unit',
    include: ['src/**/*.test.ts'],
    exclude: ['src/test/e2e/**', '**/node_modules/**'],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts', 'src/infra/**/*.ts', 'src/*.ts'],
      exclude: [
        'src/test/**',
        'src/**/*.test.ts',
        'src/**/*.bench.test.ts',
        'src/**/*.d.ts',
        'src/infra/view/js/**',
        'src/infra/view/html/**',
        '**/node_modules/**',
      ],
      reporter: ['html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage/unit',
      reportOnFailure: true,
    },
  },
});
