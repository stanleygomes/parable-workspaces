import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateHelper } from './TemplateHelper';
import { FileHelper } from './FileHelper';

vi.mock('vscode', () => ({
  Uri: {
    file: (fsPath: string) => ({ fsPath }),
  },
}));

describe('TemplateHelper', () => {
  let root: string;

  beforeEach(() => {
    TemplateHelper.clearCache();
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'template-helper-'));
    fs.writeFileSync(path.join(root, 'sample.html'), 'Hello {{name}}');
  });

  it('caches template reads across render calls', () => {
    const extensionUri = { fsPath: root } as never;
    const readSpy = vi.spyOn(FileHelper, 'readText');

    const first = TemplateHelper.render(extensionUri, ['sample.html'], {
      name: 'One',
    });
    const second = TemplateHelper.render(extensionUri, ['sample.html'], {
      name: 'Two',
    });

    expect(first).toBe('Hello One');
    expect(second).toBe('Hello Two');
    expect(readSpy).toHaveBeenCalledTimes(1);
    readSpy.mockRestore();
  });

  it('prefetches templates into the content cache', () => {
    const extensionUri = { fsPath: root } as never;
    const readSpy = vi.spyOn(FileHelper, 'readText');

    TemplateHelper.prefetch(extensionUri, [['sample.html']]);
    TemplateHelper.render(extensionUri, ['sample.html'], {
      name: 'Prefetched',
    });

    expect(readSpy).toHaveBeenCalledTimes(1);
    readSpy.mockRestore();
  });
});
