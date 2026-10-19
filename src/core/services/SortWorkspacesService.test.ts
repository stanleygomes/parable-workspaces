import { describe, expect, it } from 'vitest';
import { SortType } from '../enums/SortType';
import type { Workspace } from '../dtos/Workspace';
import { SortWorkspacesService } from './SortWorkspacesService';

function workspace(
  partial: Partial<Workspace> & Pick<Workspace, 'id' | 'name'>,
): Workspace {
  return {
    folders: [],
    tags: [],
    lastOpened: 0,
    ...partial,
  };
}

describe('SortWorkspacesService', () => {
  const service = new SortWorkspacesService();

  it('sorts alphabetically by name', () => {
    const sorted = service.sort(
      [
        workspace({ id: '2', name: 'zeta' }),
        workspace({ id: '1', name: 'alpha' }),
      ],
      SortType.Alphabetical,
    );

    expect(sorted.map((item) => item.name)).toEqual(['alpha', 'zeta']);
  });

  it('keeps favorites first then orders by recency', () => {
    const sorted = service.sort(
      [
        workspace({
          id: 'old-fav',
          name: 'old-fav',
          isFavorite: true,
          lastOpened: 1,
        }),
        workspace({
          id: 'recent',
          name: 'recent',
          isFavorite: false,
          lastOpened: 100,
        }),
        workspace({
          id: 'new-fav',
          name: 'new-fav',
          isFavorite: true,
          lastOpened: 50,
        }),
      ],
      SortType.FavoritesFirst,
    );

    expect(sorted.map((item) => item.id)).toEqual([
      'new-fav',
      'old-fav',
      'recent',
    ]);
  });

  it('orders by most recent when sort type is recent', () => {
    const sorted = service.sort(
      [
        workspace({ id: 'old', name: 'old', lastOpened: 1 }),
        workspace({ id: 'new', name: 'new', lastOpened: 50 }),
      ],
      SortType.Recent,
    );

    expect(sorted.map((item) => item.id)).toEqual(['new', 'old']);
  });
});
