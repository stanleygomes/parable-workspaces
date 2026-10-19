export interface Workspace {
  id: string;
  name: string;
  folders: string[];
  workspaceFile?: string;
  color?: string;
  textColor?: string;
  icon?: string;
  tags: string[];
  lastOpened: number;
  isFavorite?: boolean;
  emoji?: string;
}
