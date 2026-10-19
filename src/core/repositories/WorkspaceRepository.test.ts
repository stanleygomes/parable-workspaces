import { describe, expect, it, vi } from 'vitest';
import { buildRepository, buildWorkspace } from '../../test/unit/fakes';

describe('WorkspaceRepository', () => {
  it('returns every stored workspace', () => {
    const { repository } = buildRepository([
      buildWorkspace({ id: 'a' }),
      buildWorkspace({ id: 'b' }),
    ]);

    expect(repository.findAll().map((ws) => ws.id)).toEqual(['a', 'b']);
  });

  it('finds a workspace by id', () => {
    const { repository } = buildRepository([buildWorkspace({ id: 'a' })]);

    expect(repository.findOne('a')?.id).toBe('a');
    expect(repository.findOne('missing')).toBeUndefined();
  });

  it('appends new workspaces', async () => {
    const { repository, stateManager } = buildRepository([
      buildWorkspace({ id: 'a' }),
    ]);

    await repository.save(buildWorkspace({ id: 'b' }));

    expect(stateManager.workspaces.map((ws) => ws.id)).toEqual(['a', 'b']);
  });

  it('replaces existing workspaces in place', async () => {
    const { repository, stateManager } = buildRepository([
      buildWorkspace({ id: 'a', name: 'old' }),
      buildWorkspace({ id: 'b' }),
    ]);

    await repository.save(buildWorkspace({ id: 'a', name: 'new' }));

    expect(stateManager.workspaces.map((ws) => ws.name)).toEqual([
      'new',
      'Workspace One',
    ]);
  });

  it('deletes workspaces by id', async () => {
    const { repository, stateManager } = buildRepository([
      buildWorkspace({ id: 'a' }),
      buildWorkspace({ id: 'b' }),
    ]);

    await repository.delete('a');

    expect(stateManager.workspaces.map((ws) => ws.id)).toEqual(['b']);
  });

  it('notifies listeners after save and delete', async () => {
    const { repository } = buildRepository();
    const listener = vi.fn();
    repository.onDidChange(listener);

    await repository.save(buildWorkspace({ id: 'a' }));
    await repository.delete('a');

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
