import { defineConfig } from '@vscode/test-cli';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sandbox = mkdtempSync(join(tmpdir(), 'parable-e2e-'));
const workspaceFolder = join(sandbox, 'sample-project');
const configHome = join(sandbox, 'config');

mkdirSync(workspaceFolder);
mkdirSync(configHome);
writeFileSync(join(workspaceFolder, 'README.md'), '# Sample project\n');

export default defineConfig({
  files: 'out/test/e2e/**/*.test.js',
  workspaceFolder,
  env: {
    XDG_CONFIG_HOME: configHome,
    PARABLE_E2E_CONFIG_HOME: configHome,
  },
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
