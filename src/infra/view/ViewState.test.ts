import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsKey } from '../../core/enums/SettingsKey';
import { SortType } from '../../core/enums/SortType';
import { WorkspaceColors } from '../../core/enums/WorkspaceColor';
import { StringHelper } from '../../core/helpers/StringHelper';
import { FindWorkspaceService } from '../../core/services/FindWorkspaceService';
import { SortWorkspacesService } from '../../core/services/SortWorkspacesService';
import type { Workspace } from '../../core/dtos/Workspace';
import { SettingsStateManager } from '../persistence/SettingsStateManager';
import {
  FakeMemento,
  buildExtensionContext,
  buildRepository,
  buildWorkspace,
} from '../../test/unit/fakes';
import { setWorkspace } from '../../test/unit/mocks/vscode';
import { ViewState } from './ViewState';

const NOW = 1_700_000_000_000;
const CURRENT_ID = StringHelper.toBase64('/projects/current');

function setup(initial: Workspace[], settings: Record<string, unknown> = {}) {
  const { repository } = buildRepository(initial);
  const { extensionContext } = buildExtensionContext({
    globalState: new FakeMemento(settings),
  });
  return new ViewState(
    repository,
    new FindWorkspaceService(repository),
    new SortWorkspacesService(),
    new SettingsStateManager(extensionContext),
  );
}

const workspaces = [
  buildWorkspace({ id: 'b', name: 'Beta', lastOpened: NOW - 60_000 }),
  buildWorkspace({
    id: 'a',
    name: 'Alpha',
    isFavorite: true,
    lastOpened: NOW - 120_000,
    folders: ['/projects/alpha', '/projects/alpha-docs'],
  }),
  buildWorkspace({ id: 'c', name: 'Gamma', folders: [], lastOpened: NOW }),
];

describe('ViewState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads default filters when nothing is persisted', () => {
    const state = setup([]);

    expect(state.showOnlyFavorites).toBe(false);
    expect(state.currentSort).toBe(SortType.FavoritesFirst);
    expect(state.showFilters).toBe(false);
  });

  it('restores persisted filters', () => {
    const state = setup([], {
      [SettingsKey.ShowOnlyFavorites]: true,
      [SettingsKey.SortType]: SortType.Recent,
      [SettingsKey.ShowFilters]: true,
    });

    expect(state.getPayload().filters).toEqual({
      showOnlyFavorites: true,
      sortType: SortType.Recent,
      showFilters: true,
    });
  });

  it('builds the payload with display fields, sorted favorites first', () => {
    const payload = setup(workspaces).getPayload();

    expect(payload.command).toBe('updateWorkspaces');
    expect(payload.availableColors).toBe(WorkspaceColors);
    expect(payload.workspaces.map((ws) => ws.id)).toEqual(['a', 'c', 'b']);
    expect(payload.workspaces[0]).toMatchObject({
      dateLabel: '2 minutes ago',
      foldersCount: 2,
      primaryFolder: '/projects/alpha',
    });
    expect(payload.workspaces[1]).toMatchObject({
      dateLabel: 'just now',
      foldersCount: 0,
      primaryFolder: '',
    });
  });

  it('applies search, favorites filter and sort', () => {
    const state = setup(workspaces);

    state.currentSort = SortType.Alphabetical;
    expect(state.getPayload().workspaces.map((ws) => ws.id)).toEqual([
      'a',
      'b',
      'c',
    ]);

    state.currentQuery = 'a';
    state.showOnlyFavorites = true;
    expect(state.getPayload().workspaces.map((ws) => ws.id)).toEqual(['a']);
  });

  it('reports an unsaved current workspace', () => {
    setWorkspace(['/projects/current']);

    expect(setup(workspaces).getPayload().currentStatus).toEqual({
      isSaved: false,
      name: 'current',
    });
  });

  it('reports a saved current workspace', () => {
    setWorkspace(['/projects/current']);

    const payload = setup([buildWorkspace({ id: CURRENT_ID })]).getPayload();

    expect(payload.currentStatus.isSaved).toBe(true);
  });

  it('treats the absence of an open folder as saved', () => {
    expect(setup(workspaces).getPayload().currentStatus).toEqual({
      isSaved: true,
      name: '',
    });
  });
});
