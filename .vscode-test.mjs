import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/e2e/**/*.test.js',
  mocha: {
    ui: 'tdd',
    timeout: 60000,
  },
  launchArgs: [
    '--disable-extensions',
    '--disable-workspace-trust',
    '--skip-welcome',
    '--skip-release-notes',
  ],
  coverage: {
    output: './coverage/e2e',
    reporter: ['html', 'lcov'],
    exclude: ['**/out/test/**', '**/*.test.js', '**/infra/view/js/**'],
  },
});
