export interface Workspace {
  id: string;
  name: string;
  folders: string[];
  color?: string;
  icon?: string;
  tags: string[];
  lastOpened: number;
  isFavorite?: boolean;
}

