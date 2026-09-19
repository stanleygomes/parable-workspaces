import { describe, expect, it, vi } from 'vitest';
import { StringHelper } from '../../core/helpers/StringHelper';
import { EditorContext } from '../../infra/editor/EditorContext';
import type { Workspace } from '../../core/dtos/Workspace';

const workspaceState = {
  workspaceFolders: undefined as
    | Array<{ uri: { fsPath: string }; name: string }>
    | undefined,
  workspaceFile: undefined as { fsPath: string; scheme: string } | undefined,
  name: undefined as string | undefined,
};

vi.mock('vscode', () => ({
  workspace: {
    get workspaceFolders() {
      return workspaceState.workspaceFolders;
    },
    get workspaceFile() {
      return workspaceState.workspaceFile;
    },
    get name() {
      return workspaceState.name;
    },
  },
}));

describe('EditorContext.resolveOpenPath', () => {
  it('returns workspaceFile when the saved workspace records a code-workspace path', () => {
    const workspace: Workspace = {
      id: StringHelper.toBase64('/tmp/app'),
      name: 'App',
      folders: ['/tmp/app'],
      workspaceFile: '/tmp/app/app.code-workspace',
      tags: [],
      lastOpened: 1,
    };

    expect(EditorContext.resolveOpenPath(workspace)).toBe(
      '/tmp/app/app.code-workspace',
    );
  });

  it('returns a code-workspace path encoded in the workspace id when workspaceFile is missing', () => {
    const workspaceFile = '/Users/me/project/project.code-workspace';
    const workspace: Workspace = {
      id: StringHelper.toBase64(workspaceFile),
      name: 'Project',
      folders: ['/Users/me/project'],
      tags: [],
      lastOpened: 1,
    };

    expect(EditorContext.resolveOpenPath(workspace)).toBe(workspaceFile);
  });

  it('falls back to the primary folder for regular folder workspaces', () => {
    const workspace: Workspace = {
      id: StringHelper.toBase64('/tmp/plain'),
      name: 'Plain',
      folders: ['/tmp/plain'],
      tags: [],
      lastOpened: 1,
    };

    expect(EditorContext.resolveOpenPath(workspace)).toBe('/tmp/plain');
  });
});

describe('EditorContext current workspace helpers', () => {
  it('reads the current workspace file and folders', () => {
    workspaceState.workspaceFolders = [
      { uri: { fsPath: '/tmp/app' }, name: 'app' },
    ];
    workspaceState.workspaceFile = {
      fsPath: '/tmp/app/app.code-workspace',
      scheme: 'file',
    };
    workspaceState.name = 'App Workspace';

    expect(EditorContext.getCurrentWorkspaceFile()).toBe(
      '/tmp/app/app.code-workspace',
    );
    expect(EditorContext.getCurrentWorkspaceFolders()).toEqual(['/tmp/app']);
    expect(EditorContext.getCurrentWorkspaceName()).toBe('App Workspace');
    expect(EditorContext.getCurrentWorkspaceId()).toBe(
      StringHelper.toBase64('/tmp/app/app.code-workspace'),
    );
  });

  it('falls back to the folder name when no workspace file is open', () => {
    workspaceState.workspaceFolders = [
      { uri: { fsPath: '/tmp/plain' }, name: 'plain' },
    ];
    workspaceState.workspaceFile = undefined;
    workspaceState.name = undefined;

    expect(EditorContext.getCurrentWorkspaceFile()).toBeUndefined();
    expect(EditorContext.getCurrentWorkspaceName()).toBe('plain');
    expect(EditorContext.getCurrentWorkspaceId()).toBe(
      StringHelper.toBase64('/tmp/plain'),
    );
  });
});
