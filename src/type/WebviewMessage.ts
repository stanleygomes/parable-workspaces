export interface WebviewMessage {
  command: string;
  workspaceId?: string;
  query?: string;
  showOnlyFavorites?: boolean;
}
