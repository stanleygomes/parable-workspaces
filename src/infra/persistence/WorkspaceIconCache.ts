import * as vscode from 'vscode';
import { FaviconHelper } from '../../core/helpers/FaviconHelper';
import { Workspace } from '../../core/dtos/Workspace';

type CachedIcon = {
  path?: string;
  foldersKey: string;
  deepComplete: boolean;
};

export class WorkspaceIconCache {
  private static readonly STORAGE_KEY = 'workspaceIconPaths';
  private readonly entries = new Map<string, CachedIcon>();
  private persistTimer?: NodeJS.Timeout;

  constructor(private readonly context: vscode.ExtensionContext) {
    const stored =
      this.context.globalState.get<Record<string, CachedIcon>>(
        WorkspaceIconCache.STORAGE_KEY,
      ) ?? {};

    for (const [id, entry] of Object.entries(stored)) {
      if (!entry || typeof entry.foldersKey !== 'string') {
        continue;
      }
      this.entries.set(id, {
        path: entry.path,
        foldersKey: entry.foldersKey,
        deepComplete: !!entry.deepComplete,
      });
    }
  }

  public resolve(
    workspace: Workspace,
    allowDeepScan: boolean = false,
    detectIcons: boolean = true,
  ): string | undefined {
    if (workspace.icon && FaviconHelper.isCachedPathUsable(workspace.icon)) {
      return workspace.icon;
    }

    if (!detectIcons) {
      return undefined;
    }

    const foldersKey = this.buildFoldersKey(
      workspace.folders,
      workspace.workspaceFile,
    );
    const cached = this.entries.get(workspace.id);

    if (cached && cached.foldersKey === foldersKey) {
      if (cached.path && FaviconHelper.isCachedPathUsable(cached.path)) {
        return cached.path;
      }

      if (cached.path && !FaviconHelper.isCachedPathUsable(cached.path)) {
        this.entries.delete(workspace.id);
      } else if (cached.deepComplete) {
        return undefined;
      }
    }

    const found = FaviconHelper.resolveIconPath(
      workspace.folders,
      undefined,
      workspace.workspaceFile,
      allowDeepScan,
    );

    this.entries.set(workspace.id, {
      path: found,
      foldersKey,
      deepComplete: allowDeepScan || !!found || !!cached?.deepComplete,
    });
    this.schedulePersist();
    return found;
  }

  public warm(
    workspaces: Workspace[],
    allowDeepScan: boolean = false,
    detectIcons: boolean = true,
  ): void {
    if (!detectIcons) {
      return;
    }
    for (const workspace of workspaces) {
      if (workspace.emoji) {
        continue;
      }
      this.resolve(workspace, allowDeepScan, true);
    }
  }

  public invalidate(workspaceId: string): void {
    this.entries.delete(workspaceId);
    this.schedulePersist();
  }

  private buildFoldersKey(folders: string[], workspaceFile?: string): string {
    return [...folders, workspaceFile ?? ''].join('|');
  }

  private schedulePersist(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }
    this.persistTimer = setTimeout(() => {
      this.persistTimer = undefined;
      void this.persist();
    }, 250);
  }

  private async persist(): Promise<void> {
    const payload: Record<string, CachedIcon> = {};
    for (const [id, entry] of this.entries) {
      payload[id] = entry;
    }
    await this.context.globalState.update(
      WorkspaceIconCache.STORAGE_KEY,
      payload,
    );
  }
}
