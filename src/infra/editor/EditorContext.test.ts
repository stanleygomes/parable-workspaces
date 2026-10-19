import { describe, expect, it } from 'vitest';
import { StringHelper } from '../../core/helpers/StringHelper';
import { setWorkspace } from '../../test/unit/mocks/vscode';
import { EditorContext } from './EditorContext';

describe('EditorContext', () => {
  it('returns empty values without an open folder', () => {
    expect(EditorContext.getCurrentWorkspaceId()).toBeUndefined();
    expect(EditorContext.getCurrentWorkspaceFolders()).toEqual([]);
    expect(EditorContext.getCurrentWorkspaceName()).toBeUndefined();
  });

  it('treats an empty folder list as no folder', () => {
    setWorkspace([]);

    expect(EditorContext.getCurrentWorkspaceId()).toBeUndefined();
  });

  it('derives id and name from the primary folder', () => {
    setWorkspace(['/projects/api', '/projects/web']);

    expect(EditorContext.getCurrentWorkspaceId()).toBe(
      StringHelper.toBase64('/projects/api'),
    );
    expect(EditorContext.getCurrentWorkspaceName()).toBe('api');
    expect(EditorContext.getCurrentWorkspaceFolders()).toEqual([
      '/projects/api',
      '/projects/web',
    ]);
  });

  it('derives id and name from the workspace file when present', () => {
    setWorkspace(['/projects/api'], {
      workspaceFile: '/projects/stack.code-workspace',
      name: 'Stack (Workspace)',
    });

    expect(EditorContext.getCurrentWorkspaceId()).toBe(
      StringHelper.toBase64('/projects/stack.code-workspace'),
    );
    expect(EditorContext.getCurrentWorkspaceName()).toBe('Stack (Workspace)');
  });

  it('falls back to the folder name when the workspace has no name', () => {
    setWorkspace(['/projects/api'], {
      workspaceFile: '/projects/stack.code-workspace',
    });

    expect(EditorContext.getCurrentWorkspaceName()).toBe('api');
  });
});
