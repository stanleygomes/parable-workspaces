import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWorkspace } from '../../test/unit/fakes';
import { WorkspaceFileStorage } from './WorkspaceFileStorage';

describe('WorkspaceFileStorage', () => {
  let tempDir: string;
  let filePath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parable-storage-'));
    filePath = path.join(tempDir, 'nested', 'workspaces.json');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates the parent directory on construction', () => {
    new WorkspaceFileStorage(filePath);

    expect(fs.existsSync(path.dirname(filePath))).toBe(true);
  });

  it('returns an empty list when the file does not exist', () => {
    const storage = new WorkspaceFileStorage(filePath);

    expect(storage.exists()).toBe(false);
    expect(storage.read()).toEqual([]);
  });

  it('writes pretty printed json and reads it back', () => {
    const storage = new WorkspaceFileStorage(filePath);
    const workspaces = [buildWorkspace()];

    storage.write(workspaces);

    expect(storage.read()).toEqual(workspaces);
    expect(fs.readFileSync(filePath, 'utf8')).toBe(
      JSON.stringify(workspaces, null, 2),
    );
  });

  it('returns an empty list for corrupted files', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const storage = new WorkspaceFileStorage(filePath);
    fs.writeFileSync(filePath, '{ not json');

    expect(storage.read()).toEqual([]);
  });

  it('exposes file and directory paths', () => {
    const storage = new WorkspaceFileStorage(filePath);

    expect(storage.getFilePath()).toBe(filePath);
    expect(storage.getDirectoryPath()).toBe(path.dirname(filePath));
  });
});
