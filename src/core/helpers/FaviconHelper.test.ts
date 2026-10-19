import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FaviconHelper } from './FaviconHelper';

describe('FaviconHelper', () => {
  let root: string;

  beforeEach(() => {
    FaviconHelper.clearCache();
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'parable-favicon-'));
  });

  afterEach(() => {
    FaviconHelper.clearCache();
    fs.rmSync(root, { recursive: true, force: true });
  });

  const writePng = (relativePath: string): string => {
    const fullPath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    );
    return fullPath;
  };

  it('discovers favicon.png in the workspace root before searching nested dirs', () => {
    const rootIcon = writePng('favicon.png');
    writePng('public/logo.png');

    expect(FaviconHelper.findInFolder(root)).toBe(rootIcon);
  });

  it('discovers icons under common public and assets directories', () => {
    const publicIcon = writePng('public/icon.png');

    expect(FaviconHelper.findInFolder(root)).toBe(publicIcon);
  });

  it('discovers icons under nested packages/*/public directories', () => {
    const nested = writePng('packages/web/public/favicon.png');

    expect(FaviconHelper.findInFolder(root)).toBe(nested);
  });

  it('discovers icons under nested apps/*/public directories', () => {
    const nested = writePng('apps/web/public/logo.png');

    expect(FaviconHelper.findInFolder(root)).toBe(nested);
  });

  it('ignores .ico files during discovery', () => {
    const icoPath = path.join(root, 'favicon.ico');
    fs.writeFileSync(icoPath, Buffer.from([0, 0, 1, 0]));
    const png = writePng('assets/icon.png');

    expect(FaviconHelper.findInFolder(root)).toBe(png);
    expect(FaviconHelper.listCandidateIcons([root])).not.toContain(icoPath);
  });

  it('supports png svg webp jpg jpeg and gif extensions only', () => {
    const png = writePng('favicon.png');
    expect(FaviconHelper.isCachedPathUsable(png)).toBe(true);

    for (const ext of ['.svg', '.webp', '.jpg', '.jpeg', '.gif']) {
      const filePath = path.join(root, `logo${ext}`);
      fs.writeFileSync(filePath, Buffer.from('image'));
      expect(FaviconHelper.isCachedPathUsable(filePath)).toBe(true);
    }

    const ico = path.join(root, 'logo.ico');
    fs.writeFileSync(ico, Buffer.from('image'));
    expect(FaviconHelper.isCachedPathUsable(ico)).toBe(false);
  });

  it('prefers a usable configured icon over detected icons', () => {
    const configured = writePng('brand/custom.png');
    writePng('favicon.png');

    expect(
      FaviconHelper.resolveIconPath([root], configured, undefined, true),
    ).toBe(configured);
  });

  it('falls back to detection when configured icon is missing', () => {
    const detected = writePng('public/favicon.png');

    expect(
      FaviconHelper.resolveIconPath(
        [root],
        path.join(root, 'missing.png'),
        undefined,
        true,
      ),
    ).toBe(detected);
  });

  it('searches the directory containing a code-workspace file', () => {
    const workspaceFile = path.join(root, 'project.code-workspace');
    fs.writeFileSync(workspaceFile, '{}');
    const icon = writePng('favicon.png');
    const folder = path.join(root, 'packages', 'app');
    fs.mkdirSync(folder, { recursive: true });

    expect(
      FaviconHelper.resolveIconPath([folder], undefined, workspaceFile, true),
    ).toBe(icon);
  });

  it('deep scans gitignore-aware folders and exits early on a strong hit', () => {
    fs.writeFileSync(path.join(root, '.gitignore'), 'ignored\n');
    writePng('ignored/favicon.png');
    const nested = writePng('src/features/home/favicon.png');

    expect(FaviconHelper.findInFolder(root, true)).toBe(nested);
  });

  it('skips deep scan when allowDeepScan is false', () => {
    writePng('src/features/home/favicon.png');

    expect(FaviconHelper.findInFolder(root, false)).toBeUndefined();
  });

  it('returns a relative tooltip path from the workspace root', () => {
    const icon = writePng('public/favicon.png');

    expect(FaviconHelper.toRelativePath(icon, [root])).toBe(
      'public/favicon.png',
    );
  });

  it('copies display-safe icons into the webview cache directory', () => {
    const icon = writePng('favicon.png');
    const cacheDir = path.join(root, 'cache');

    const cached = FaviconHelper.toWebviewIconPath(icon, cacheDir);

    expect(cached).toBeDefined();
    expect(cached?.startsWith(cacheDir)).toBe(true);
    expect(fs.existsSync(cached!)).toBe(true);
  });

  it('rejects .ico for webview and quick pick serving', () => {
    const ico = path.join(root, 'favicon.ico');
    fs.writeFileSync(ico, Buffer.from([0, 0, 1, 0, 1, 0]));
    const cacheDir = path.join(root, 'cache');

    expect(FaviconHelper.toWebviewIconPath(ico, cacheDir)).toBeUndefined();
    expect(FaviconHelper.toQuickPickIconPath(ico, cacheDir)).toBeUndefined();
  });
});
