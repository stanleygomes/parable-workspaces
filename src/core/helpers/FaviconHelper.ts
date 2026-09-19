import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { FileHelper } from './FileHelper';

const ICON_BASE_NAMES = ['favicon', 'icon', 'logo'];

const IMAGE_EXTENSIONS = [
  '.png',
  '.svg',
  '.webp',
  '.jpg',
  '.jpeg',
  '.gif',
] as const;

const IMAGE_EXTENSION_SET = new Set<string>(IMAGE_EXTENSIONS);

const ICON_CANDIDATES = ICON_BASE_NAMES.flatMap((base) =>
  IMAGE_EXTENSIONS.map((ext) => `${base}${ext}`),
);

const SEARCH_DIRS = [
  'public',
  'assets',
  'static',
  'images',
  'img',
  'icons',
  'brand',
  'public/brand',
  'assets/brand',
  'static/brand',
  'src/assets',
  'src/assets/brand',
  'app/assets',
  'app',
  'src',
  'www',
  'client',
  'web',
  'packages/web',
  'packages/web/public',
  'packages/app',
  'packages/app/public',
  'apps/web',
  'apps/web/public',
  'apps/app',
  'apps/app/public',
  'media',
  'resources',
  'resources/icons',
];

const NESTED_PUBLIC_DIR_GLOBS = [
  'packages/*/public',
  'apps/*/public',
  'packages/*/*/public',
];

const NAME_KEYWORDS = ['favicon', 'icon', 'logo'];

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const MAX_ICON_BYTES = 2 * 1024 * 1024;
const MAX_DEEP_SCAN_ENTRIES = 5000;
const RESOLVE_CACHE_TTL_MS = 30 * 60 * 1000;

const DEFAULT_IGNORES = [
  '.git',
  'node_modules',
  'bower_components',
  'jspm_packages',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  'vendor',
  'target',
  '.venv',
  'venv',
  '__pycache__',
];

export class FaviconHelper {
  private static readonly resolveCache = new Map<
    string,
    { value?: string; deepComplete: boolean; expiresAt: number }
  >();

  public static clearCache(): void {
    this.resolveCache.clear();
  }

  public static isCachedPathUsable(filePath: string): boolean {
    return this.isUsableImage(filePath);
  }

  public static toRelativePath(
    filePath: string,
    folders: string[],
    workspaceFile?: string,
  ): string {
    const roots = [
      ...(workspaceFile ? [path.dirname(workspaceFile)] : []),
      ...folders,
    ];
    const normalizedFile = path.normalize(filePath);
    const relativeRoot =
      roots.find((root) => {
        const normalizedRoot = path.normalize(root);
        return (
          normalizedFile === normalizedRoot ||
          normalizedFile.startsWith(`${normalizedRoot}${path.sep}`)
        );
      }) || roots[0];

    if (!relativeRoot) {
      return path.basename(filePath);
    }

    return path.relative(relativeRoot, filePath).split(path.sep).join('/');
  }

  public static toQuickPickIconPath(
    filePath: string,
    cacheDir: string,
  ): string | undefined {
    if (!this.isUsableImage(filePath)) {
      return undefined;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!this.isDirectDisplaySafe(ext)) {
      return undefined;
    }

    return filePath;
  }

  public static toWebviewIconPath(
    filePath: string,
    cacheDir: string,
  ): string | undefined {
    if (!this.isUsableImage(filePath)) {
      return undefined;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!this.isDirectDisplaySafe(ext)) {
      return undefined;
    }

    return this.materializeIconCopy(filePath, cacheDir, ext);
  }

  private static materializeIconCopy(
    filePath: string,
    cacheDir: string,
    ext: string,
  ): string {
    return this.writeCachedIcon(
      filePath,
      cacheDir,
      ext,
      fs.readFileSync(filePath),
    );
  }

  private static writeCachedIcon(
    filePath: string,
    cacheDir: string,
    ext: string,
    buffer: Buffer,
  ): string {
    const hash = crypto
      .createHash('sha1')
      .update(filePath)
      .update(String(fs.statSync(filePath).mtimeMs))
      .digest('hex')
      .slice(0, 16);
    const outPath = path.join(cacheDir, `${hash}${ext}`);
    if (!FileHelper.exists(outPath)) {
      FileHelper.mkdir(cacheDir);
      fs.writeFileSync(outPath, buffer);
    }
    return outPath;
  }

  public static findInFolders(
    folders: string[],
    allowDeepScan: boolean = true,
  ): string | undefined {
    for (const folder of folders) {
      const found = this.findInFolder(folder, allowDeepScan);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  public static findInFolder(
    folder: string,
    allowDeepScan: boolean = true,
  ): string | undefined {
    if (!FileHelper.exists(folder)) {
      return undefined;
    }

    const rootCandidate = this.findCandidateInDir(folder);
    if (rootCandidate) {
      return rootCandidate;
    }

    const rootNamed = this.findNamedIconFile(folder);
    if (rootNamed) {
      return rootNamed;
    }

    for (const dir of SEARCH_DIRS) {
      const dirPath = FileHelper.buildPath(folder, dir);
      if (!this.isDirectory(dirPath)) {
        continue;
      }

      const dirCandidate = this.findCandidateInDir(dirPath);
      if (dirCandidate) {
        return dirCandidate;
      }

      const named = this.findNamedIconFile(dirPath);
      if (named) {
        return named;
      }
    }

    const nestedPublic = this.findInNestedPublicDirs(folder);
    if (nestedPublic) {
      return nestedPublic;
    }

    if (!allowDeepScan) {
      return undefined;
    }

    return this.deepScanForNamedIcon(folder);
  }

  public static resolveIconPath(
    folders: string[],
    configuredIcon?: string,
    workspaceFile?: string,
    allowDeepScan: boolean = true,
  ): string | undefined {
    if (configuredIcon && this.isUsableImage(configuredIcon)) {
      return configuredIcon;
    }

    const searchRoots = this.buildSearchRoots(folders, workspaceFile);
    const cacheKey = searchRoots.join('|');
    const cached = this.resolveCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      if (cached.value || cached.deepComplete || !allowDeepScan) {
        return cached.value;
      }
    }

    const found = this.findInFolders(searchRoots, allowDeepScan);
    this.resolveCache.set(cacheKey, {
      value: found ?? cached?.value,
      deepComplete: allowDeepScan || !!found || !!cached?.deepComplete,
      expiresAt: Date.now() + RESOLVE_CACHE_TTL_MS,
    });
    return found ?? cached?.value;
  }

  public static listCandidateIcons(
    folders: string[],
    limit: number = 20,
    workspaceFile?: string,
  ): string[] {
    const found = new Set<string>();
    const searchRoots = this.buildSearchRoots(folders, workspaceFile);

    const add = (filePath?: string): void => {
      if (!filePath || found.size >= limit) {
        return;
      }
      if (this.isUsableImage(filePath)) {
        found.add(path.normalize(filePath));
      }
    };

    for (const folder of searchRoots) {
      if (!FileHelper.exists(folder) || found.size >= limit) {
        continue;
      }

      for (const candidate of ICON_CANDIDATES) {
        add(FileHelper.buildPath(folder, candidate));
      }

      this.collectNamedIconFiles(folder).forEach(add);

      for (const dir of SEARCH_DIRS) {
        if (found.size >= limit) {
          break;
        }
        const dirPath = FileHelper.buildPath(folder, dir);
        if (!this.isDirectory(dirPath)) {
          continue;
        }
        for (const candidate of ICON_CANDIDATES) {
          add(FileHelper.buildPath(dirPath, candidate));
        }
        this.collectNamedIconFiles(dirPath).forEach(add);
      }

      this.expandNestedPublicDirs(folder).forEach((dirPath) => {
        if (found.size >= limit) {
          return;
        }
        for (const candidate of ICON_CANDIDATES) {
          add(FileHelper.buildPath(dirPath, candidate));
        }
        this.collectNamedIconFiles(dirPath).forEach(add);
      });

      if (found.size < limit) {
        this.collectDeepNamedIcons(folder, limit - found.size).forEach(add);
      }
    }

    return [...found]
      .sort((a, b) => {
        const scoreDiff =
          this.iconNameScore(path.basename(b)) -
          this.iconNameScore(path.basename(a));
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        return a.localeCompare(b);
      })
      .slice(0, limit);
  }

  private static buildSearchRoots(
    folders: string[],
    workspaceFile?: string,
  ): string[] {
    const roots: string[] = [];
    const seen = new Set<string>();

    const addRoot = (root?: string): void => {
      if (!root) {
        return;
      }
      const normalized = path.normalize(root);
      if (seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      roots.push(normalized);
    };

    if (workspaceFile) {
      addRoot(path.dirname(workspaceFile));
    }

    for (const folder of folders) {
      addRoot(folder);
    }

    return roots;
  }

  public static toDataUri(filePath: string): string | undefined {
    if (!this.isUsableImage(filePath)) {
      return undefined;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext];
    if (!mime) {
      return undefined;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      if (buffer.length === 0 || buffer.length > MAX_ICON_BYTES) {
        return undefined;
      }
      return `data:${mime};base64,${buffer.toString('base64')}`;
    } catch {
      return undefined;
    }
  }

  private static deepScanForNamedIcon(root: string): string | undefined {
    const ignore = this.loadIgnoreRules(root);
    let bestPath: string | undefined;
    let bestScore = 0;
    let scanned = 0;

    const walk = (dirPath: string): string | undefined => {
      if (scanned >= MAX_DEEP_SCAN_ENTRIES) {
        return undefined;
      }

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dirPath, { withFileTypes: true });
      } catch {
        return undefined;
      }

      const dirs: string[] = [];

      for (const entry of entries) {
        scanned += 1;
        if (scanned > MAX_DEEP_SCAN_ENTRIES) {
          break;
        }

        const fullPath = FileHelper.buildPath(dirPath, entry.name);
        const relativePath = path
          .relative(root, fullPath)
          .split(path.sep)
          .join('/');

        if (entry.isDirectory()) {
          if (!this.shouldIgnore(relativePath, true, ignore)) {
            dirs.push(fullPath);
          }
          continue;
        }

        if (!entry.isFile() || this.shouldIgnore(relativePath, false, ignore)) {
          continue;
        }

        if (
          !this.isNamedIconFile(entry.name) ||
          !this.isUsableImage(fullPath)
        ) {
          continue;
        }

        const score = this.iconNameScore(entry.name);
        if (score >= 3) {
          return fullPath;
        }
        if (score > bestScore) {
          bestScore = score;
          bestPath = fullPath;
        }
      }

      dirs.sort((a, b) => {
        const aPublic = a.includes(`${path.sep}public`) || a.endsWith('public');
        const bPublic = b.includes(`${path.sep}public`) || b.endsWith('public');
        if (aPublic !== bPublic) {
          return aPublic ? -1 : 1;
        }
        return a.localeCompare(b);
      });

      for (const child of dirs) {
        if (scanned >= MAX_DEEP_SCAN_ENTRIES) {
          break;
        }
        const found = walk(child);
        if (found) {
          return found;
        }
      }

      return undefined;
    };

    return walk(root) ?? bestPath;
  }

  private static findInNestedPublicDirs(folder: string): string | undefined {
    for (const dirPath of this.expandNestedPublicDirs(folder)) {
      const candidate = this.findCandidateInDir(dirPath);
      if (candidate) {
        return candidate;
      }

      const named = this.findNamedIconFile(dirPath);
      if (named) {
        return named;
      }
    }
    return undefined;
  }

  private static findCandidateInDir(dirPath: string): string | undefined {
    for (const candidate of ICON_CANDIDATES) {
      const fullPath = FileHelper.buildPath(dirPath, candidate);
      if (this.isUsableImage(fullPath)) {
        return fullPath;
      }
    }
    return undefined;
  }

  private static expandNestedPublicDirs(folder: string): string[] {
    const results: string[] = [];

    for (const pattern of NESTED_PUBLIC_DIR_GLOBS) {
      const parts = pattern.split('/');
      this.expandGlobParts(folder, parts, results);
    }

    return results;
  }

  private static expandGlobParts(
    currentPath: string,
    parts: string[],
    results: string[],
  ): void {
    if (parts.length === 0) {
      if (this.isDirectory(currentPath)) {
        results.push(currentPath);
      }
      return;
    }

    const [head, ...rest] = parts;
    if (!this.isDirectory(currentPath)) {
      return;
    }

    if (head === '*') {
      let entries: string[];
      try {
        entries = fs.readdirSync(currentPath);
      } catch {
        return;
      }

      for (const entry of entries) {
        if (entry.startsWith('.')) {
          continue;
        }
        const nextPath = FileHelper.buildPath(currentPath, entry);
        if (this.isDirectory(nextPath)) {
          this.expandGlobParts(nextPath, rest, results);
        }
      }
      return;
    }

    this.expandGlobParts(
      FileHelper.buildPath(currentPath, head),
      rest,
      results,
    );
  }

  private static collectDeepNamedIcons(root: string, limit: number): string[] {
    const ignore = this.loadIgnoreRules(root);
    const results: string[] = [];
    let scanned = 0;

    const walk = (dirPath: string): void => {
      if (results.length >= limit || scanned >= MAX_DEEP_SCAN_ENTRIES) {
        return;
      }

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dirPath, { withFileTypes: true });
      } catch {
        return;
      }

      const dirs: string[] = [];

      for (const entry of entries) {
        scanned += 1;
        if (scanned > MAX_DEEP_SCAN_ENTRIES || results.length >= limit) {
          break;
        }

        const fullPath = FileHelper.buildPath(dirPath, entry.name);
        const relativePath = path
          .relative(root, fullPath)
          .split(path.sep)
          .join('/');

        if (entry.isDirectory()) {
          if (!this.shouldIgnore(relativePath, true, ignore)) {
            dirs.push(fullPath);
          }
          continue;
        }

        if (!entry.isFile() || this.shouldIgnore(relativePath, false, ignore)) {
          continue;
        }

        if (this.isNamedIconFile(entry.name) && this.isUsableImage(fullPath)) {
          results.push(fullPath);
        }
      }

      dirs.sort((a, b) => {
        const aPublic = a.includes(`${path.sep}public`) || a.endsWith('public');
        const bPublic = b.includes(`${path.sep}public`) || b.endsWith('public');
        if (aPublic !== bPublic) {
          return aPublic ? -1 : 1;
        }
        return a.localeCompare(b);
      });

      for (const child of dirs) {
        if (results.length >= limit) {
          break;
        }
        walk(child);
      }
    };

    walk(root);
    return results;
  }

  private static collectNamedIconFiles(dirPath: string): string[] {
    try {
      return fs
        .readdirSync(dirPath)
        .filter((entry) => this.isNamedIconFile(entry))
        .map((entry) => FileHelper.buildPath(dirPath, entry))
        .filter((filePath) => this.isUsableImage(filePath));
    } catch {
      return [];
    }
  }

  private static loadIgnoreRules(root: string): string[] {
    const patterns = new Set<string>(DEFAULT_IGNORES);
    const gitignorePath = FileHelper.buildPath(root, '.gitignore');

    if (FileHelper.exists(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && !line.startsWith('#'))
          .forEach((line) => patterns.add(line));
      } catch {
        // Keep default ignores when .gitignore cannot be read.
      }
    }

    return ['.git', ...patterns];
  }

  private static shouldIgnore(
    relativePath: string,
    isDirectory: boolean,
    patterns: string[],
  ): boolean {
    const normalized = relativePath.replace(/\\/g, '/');
    const segments = normalized.split('/');

    for (const pattern of patterns) {
      if (pattern.startsWith('!')) {
        continue;
      }

      const cleaned = pattern.replace(/^\//, '').replace(/\/$/, '');
      if (!cleaned) {
        continue;
      }

      if (cleaned.includes('/')) {
        if (this.matchPathPattern(normalized, cleaned, isDirectory)) {
          return true;
        }
        continue;
      }

      if (cleaned.includes('*') || cleaned.includes('?')) {
        const regex = this.globToRegExp(cleaned);
        if (segments.some((segment) => regex.test(segment))) {
          return true;
        }
        if (regex.test(path.basename(normalized))) {
          return true;
        }
        continue;
      }

      if (segments.includes(cleaned)) {
        return true;
      }
    }

    return false;
  }

  private static matchPathPattern(
    relativePath: string,
    pattern: string,
    isDirectory: boolean,
  ): boolean {
    const regex = this.globToRegExp(pattern);
    if (regex.test(relativePath)) {
      return true;
    }
    if (isDirectory && regex.test(`${relativePath}/`)) {
      return true;
    }
    if (relativePath.startsWith(`${pattern}/`) || relativePath === pattern) {
      return true;
    }

    if (pattern.startsWith('**/')) {
      const suffix = pattern.slice(3);
      if (
        !suffix.includes('/') &&
        !suffix.includes('*') &&
        !suffix.includes('?')
      ) {
        const segments = relativePath.split('/');
        if (segments.includes(suffix)) {
          return true;
        }
      }
      if (relativePath === suffix || relativePath.endsWith(`/${suffix}`)) {
        return true;
      }
    }

    return false;
  }

  private static globToRegExp(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '::DOUBLESTAR::')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(/::DOUBLESTAR::/g, '.*');
    return new RegExp(`^${escaped}$`);
  }

  private static findNamedIconFile(dirPath: string): string | undefined {
    try {
      const entries = fs.readdirSync(dirPath);
      let bestPath: string | undefined;
      let bestScore = 0;

      for (const entry of entries) {
        if (!this.isNamedIconFile(entry)) {
          continue;
        }
        const fullPath = FileHelper.buildPath(dirPath, entry);
        if (!this.isUsableImage(fullPath)) {
          continue;
        }

        const score = this.iconNameScore(entry);
        if (score >= 3) {
          return fullPath;
        }
        if (score > bestScore) {
          bestScore = score;
          bestPath = fullPath;
        }
      }

      return bestPath;
    } catch {
      return undefined;
    }
  }

  private static iconNameScore(fileName: string): number {
    const lower = fileName.toLowerCase();
    if (lower.includes('favicon')) {
      return 3;
    }
    if (lower.includes('icon')) {
      return 2;
    }
    if (lower.includes('logo')) {
      return 1;
    }
    return 0;
  }

  private static isNamedIconFile(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return NAME_KEYWORDS.some((keyword) => lower.includes(keyword));
  }

  private static isDirectory(dirPath: string): boolean {
    if (!FileHelper.exists(dirPath)) {
      return false;
    }
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  private static isDirectDisplaySafe(ext: string): boolean {
    return IMAGE_EXTENSION_SET.has(ext);
  }

  private static isUsableImage(filePath: string): boolean {
    if (!FileHelper.exists(filePath)) {
      return false;
    }
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile() || stats.size === 0 || stats.size > MAX_ICON_BYTES) {
        return false;
      }
      return IMAGE_EXTENSION_SET.has(path.extname(filePath).toLowerCase());
    } catch {
      return false;
    }
  }
}
