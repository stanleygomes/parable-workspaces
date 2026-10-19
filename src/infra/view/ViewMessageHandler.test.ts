import { describe, expect, it, vi } from 'vitest';
import { SortType } from '../../core/enums/SortType';
import type { WebviewMessage } from '../../core/dtos/WebviewMessage';
import { ViewMessageHandler } from './ViewMessageHandler';
import type { ViewState } from './ViewState';

function setup() {
  const deps = {
    save: { save: vi.fn() },
    open: { open: vi.fn() },
    remove: { delete: vi.fn() },
    favorite: { toggle: vi.fn() },
    rename: { update: vi.fn() },
    emoji: { update: vi.fn() },
    color: { update: vi.fn() },
    viewState: { currentQuery: '' },
    filter: {
      toggleFavoritesFilter: vi.fn(),
      toggleFilters: vi.fn(),
      changeSort: vi.fn(),
    },
    refresh: vi.fn(),
  };
  const handler = new ViewMessageHandler(
    deps.save as never,
    deps.open as never,
    deps.remove as never,
    deps.favorite as never,
    deps.rename as never,
    deps.emoji as never,
    deps.color as never,
    deps.viewState as unknown as ViewState,
    deps.filter as never,
    deps.refresh,
  );
  return { handler, deps };
}

type Deps = ReturnType<typeof setup>['deps'];

const workspaceCommands: [
  string,
  (deps: Deps) => ReturnType<typeof vi.fn>,
  unknown[],
][] = [
  ['openWorkspace', (d) => d.open.open, ['ws-1', false]],
  ['openWorkspaceNewWindow', (d) => d.open.open, ['ws-1', true]],
  ['toggleFavorite', (d) => d.favorite.toggle, ['ws-1']],
  ['deleteWorkspace', (d) => d.remove.delete, ['ws-1']],
  ['editWorkspace', (d) => d.rename.update, ['ws-1']],
  ['changeEmoji', (d) => d.emoji.update, ['ws-1']],
  ['changeColor', (d) => d.color.update, ['ws-1']],
];

describe('ViewMessageHandler', () => {
  describe.each(workspaceCommands)('%s', (command, target, expectedArgs) => {
    it('dispatches to the service with the workspace id', async () => {
      const { handler, deps } = setup();

      await handler.handle({ command, workspaceId: 'ws-1' });

      expect(target(deps)).toHaveBeenCalledWith(...expectedArgs);
    });

    it('ignores messages without workspace id', async () => {
      const { handler, deps } = setup();

      await handler.handle({ command });

      expect(target(deps)).not.toHaveBeenCalled();
    });
  });

  it('saves the current workspace', async () => {
    const { handler, deps } = setup();

    await handler.handle({ command: 'saveCurrent' });

    expect(deps.save.save).toHaveBeenCalledOnce();
  });

  it.each([
    [{ command: 'search', query: 'api' }, 'api'],
    [{ command: 'search' }, ''],
  ] as [WebviewMessage, string][])(
    'stores the search query and refreshes for %o',
    async (message, expected) => {
      const { handler, deps } = setup();

      await handler.handle(message);

      expect(deps.viewState.currentQuery).toBe(expected);
      expect(deps.refresh).toHaveBeenCalledOnce();
    },
  );

  it('toggles the favorites filter and refreshes', async () => {
    const { handler, deps } = setup();

    await handler.handle({ command: 'toggleFavoritesFilter' });

    expect(deps.filter.toggleFavoritesFilter).toHaveBeenCalledWith(false);
    expect(deps.refresh).toHaveBeenCalledOnce();
  });

  it('toggles the filters panel and refreshes', async () => {
    const { handler, deps } = setup();

    await handler.handle({ command: 'toggleFilters', showFilters: true });

    expect(deps.filter.toggleFilters).toHaveBeenCalledWith(true);
    expect(deps.refresh).toHaveBeenCalledOnce();
  });

  it('changes the sort type and refreshes', async () => {
    const { handler, deps } = setup();

    await handler.handle({ command: 'changeSort', sortType: 'recent' });

    expect(deps.filter.changeSort).toHaveBeenCalledWith(SortType.Recent);
    expect(deps.refresh).toHaveBeenCalledOnce();
  });

  it('ignores sort changes without sort type', async () => {
    const { handler, deps } = setup();

    await handler.handle({ command: 'changeSort' });

    expect(deps.filter.changeSort).not.toHaveBeenCalled();
    expect(deps.refresh).not.toHaveBeenCalled();
  });

  it('refreshes on demand', async () => {
    const { handler, deps } = setup();

    await handler.handle({ command: 'refresh' });

    expect(deps.refresh).toHaveBeenCalledOnce();
  });

  it('ignores unknown commands', async () => {
    const { handler, deps } = setup();

    await handler.handle({ command: 'unknown' });

    expect(deps.refresh).not.toHaveBeenCalled();
    expect(deps.save.save).not.toHaveBeenCalled();
  });
});
