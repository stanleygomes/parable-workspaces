import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { performance } from 'perf_hooks';
import { FaviconHelper } from '../../core/helpers/FaviconHelper';
import { WorkspaceIconCache } from './WorkspaceIconCache';
import { ViewProvider } from '../view/ViewProvider';
import type { Workspace } from '../../core/dtos/Workspace';

const fsCounters = {
  statCalls: 0,
  readdirCalls: 0,
};

vi.mock('vscode', () => ({
  Uri: {
    file: (fsPath: string) => ({ fsPath, scheme: 'file' }),
  },
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    statSync: ((...args: Parameters<typeof actual.statSync>) => {
      fsCounters.statCalls += 1;
      return actual.statSync(...args);
    }) as typeof actual.statSync,
    readdirSync: ((...args: Parameters<typeof actual.readdirSync>) => {
      fsCounters.readdirCalls += 1;
      return actual.readdirSync(...args);
    }) as typeof actual.readdirSync,
  };
});

type BenchResult = {
  label: string;
  workspaceCount: number;
  coldMs: number;
  warmMs: number;
  coldStatCalls: number;
  warmStatCalls: number;
  coldReaddirCalls: number;
  warmReaddirCalls: number;
};

function resetFsCounters(): void {
  fsCounters.statCalls = 0;
  fsCounters.readdirCalls = 0;
}

function createFixtureWorkspace(root: string, index: number): Workspace {
  const folder = path.join(root, `ws-${index}`);
  fs.mkdirSync(path.join(folder, 'public'), { recursive: true });
  fs.writeFileSync(
    path.join(folder, 'public', 'favicon.png'),
    Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]),
  );
  return {
    id: `ws-${index}`,
    name: `Workspace ${index}`,
    folders: [folder],
    tags: [],
    lastOpened: index,
  };
}

function createCache(): WorkspaceIconCache {
  return new WorkspaceIconCache({
    globalState: {
      get: (): Record<string, never> => ({}),
      update: async (): Promise<void> => undefined,
    },
  } as never);
}

function withFsCounters<T>(run: () => T): {
  value: T;
  statCalls: number;
  readdirCalls: number;
} {
  resetFsCounters();
  const value = run();
  return {
    value,
    statCalls: fsCounters.statCalls,
    readdirCalls: fsCounters.readdirCalls,
  };
}

function measureResolve(
  label: string,
  workspaces: Workspace[],
  mode: 'no-cache' | 'icon-cache',
): BenchResult {
  FaviconHelper.clearCache();
  const cache = createCache();

  const resolveOne = (workspace: Workspace, allowDeepScan: boolean) => {
    if (mode === 'icon-cache') {
      cache.resolve(workspace, allowDeepScan, true);
      return;
    }
    FaviconHelper.clearCache();
    FaviconHelper.resolveIconPath(
      workspace.folders,
      undefined,
      workspace.workspaceFile,
      allowDeepScan,
    );
  };

  const cold = withFsCounters(() => {
    const started = performance.now();
    for (const workspace of workspaces) {
      resolveOne(workspace, true);
    }
    return performance.now() - started;
  });

  const warm = withFsCounters(() => {
    const started = performance.now();
    for (const workspace of workspaces) {
      resolveOne(workspace, false);
    }
    return performance.now() - started;
  });

  return {
    label,
    workspaceCount: workspaces.length,
    coldMs: Number(cold.value.toFixed(3)),
    warmMs: Number(warm.value.toFixed(3)),
    coldStatCalls: cold.statCalls,
    warmStatCalls: warm.statCalls,
    coldReaddirCalls: cold.readdirCalls,
    warmReaddirCalls: warm.readdirCalls,
  };
}

describe('sidebar icon performance bench', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'sidebar-icon-bench-'));
    resetFsCounters();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('measures cache wins and remount avoidance', () => {
    const results: BenchResult[] = [];
    for (const count of [25, 100]) {
      const workspaces = Array.from({ length: count }, (_, index) =>
        createFixtureWorkspace(root, index),
      );
      results.push(
        measureResolve(`no-cache-N${count}`, workspaces, 'no-cache'),
      );
      results.push(
        measureResolve(`icon-cache-N${count}`, workspaces, 'icon-cache'),
      );
    }

    const extensionUri = { fsPath: '/ext', scheme: 'file' } as never;
    const cacheDir = '/tmp/parable-webview-icons';
    const first = ViewProvider.buildLocalResourceRoots(extensionUri, cacheDir);
    const second = ViewProvider.buildLocalResourceRoots(extensionUri, cacheDir);
    const provider = new ViewProvider(
      extensionUri,
      {
        onDidChange: (): void => undefined,
        findAll: (): never[] => [],
        findOne: (): undefined => undefined,
      } as never,
      {} as never,
      {} as never,
      {} as never,
      { search: (): never[] => [] } as never,
      {} as never,
      {
        get: (_key: string, fallback: unknown): unknown => fallback,
        detectsIcons: (): boolean => false,
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        resolve: (): undefined => undefined,
        warm: (): void => undefined,
      } as never,
      cacheDir,
    );

    const remountAvoidance = {
      identicalPaths:
        JSON.stringify(first.map((uri) => uri.fsPath)) ===
        JSON.stringify(second.map((uri) => uri.fsPath)),
      sameProviderInstance:
        provider.getLocalResourceRoots() === provider.getLocalResourceRoots(),
    };

    const report = {
      generatedAt: new Date().toISOString(),
      remountAvoidance,
      results,
    };

    if (process.env.WRITE_PERF_DOCS === '1') {
      const outDir = path.join(process.cwd(), 'docs');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, 'perf-sidebar-icons.raw.json'),
        `${JSON.stringify(report, null, 2)}\n`,
      );
    }

    expect(remountAvoidance.identicalPaths).toBe(true);
    expect(remountAvoidance.sameProviderInstance).toBe(true);

    const cached100 = results.find((row) => row.label === 'icon-cache-N100');
    const uncached100 = results.find((row) => row.label === 'no-cache-N100');
    expect(cached100).toBeDefined();
    expect(uncached100).toBeDefined();
    expect(cached100!.warmStatCalls).toBeLessThan(uncached100!.warmStatCalls);
    expect(cached100!.warmMs).toBeLessThan(uncached100!.warmMs);
  });
});
