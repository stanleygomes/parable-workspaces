import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileHelper } from './FileHelper';

describe('FileHelper', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parable-file-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('joins path segments', () => {
    expect(FileHelper.buildPath('/base', 'a', 'b.json')).toBe(
      path.join('/base', 'a', 'b.json'),
    );
  });

  it('returns an empty string when reading a missing file', () => {
    expect(FileHelper.readText(path.join(tempDir, 'missing.txt'))).toBe('');
  });

  it('writes text creating missing parent directories', () => {
    const filePath = path.join(tempDir, 'nested', 'deep', 'file.txt');

    FileHelper.writeText(filePath, 'content');

    expect(FileHelper.readText(filePath)).toBe('content');
  });

  it('overwrites existing files', () => {
    const filePath = path.join(tempDir, 'file.txt');
    FileHelper.writeText(filePath, 'first');

    FileHelper.writeText(filePath, 'second');

    expect(FileHelper.readText(filePath)).toBe('second');
  });

  it('reports whether a path exists', () => {
    const filePath = path.join(tempDir, 'file.txt');
    expect(FileHelper.exists(filePath)).toBe(false);

    FileHelper.writeText(filePath, '');

    expect(FileHelper.exists(filePath)).toBe(true);
  });

  it('creates directories recursively and tolerates existing ones', () => {
    const dirPath = path.join(tempDir, 'a', 'b');

    FileHelper.mkdir(dirPath);
    FileHelper.mkdir(dirPath);

    expect(fs.statSync(dirPath).isDirectory()).toBe(true);
  });
});
