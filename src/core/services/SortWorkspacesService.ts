import { Workspace } from '../dtos/Workspace';
import { SortType } from '../enums/SortType';

export class SortWorkspacesService {
  public sort(workspaces: Workspace[], sortType: SortType): Workspace[] {
    return [...workspaces].sort((a, b) => {
      switch (sortType) {
        case SortType.FavoritesFirst: {
          const aFav = a.isFavorite ?? false;
          const bFav = b.isFavorite ?? false;
          if (aFav && !bFav) {
            return -1;
          }
          if (!aFav && bFav) {
            return 1;
          }
          return b.lastOpened - a.lastOpened;
        }
        case SortType.Alphabetical:
          return a.name.localeCompare(b.name);
        case SortType.Recent:
          return b.lastOpened - a.lastOpened;
        default:
          return 0;
      }
    });
  }
}
