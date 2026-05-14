export interface Project {
  id: string;
  name: string;
  path: string;
  color?: string;
  icon?: string;
  tags: string[];
  lastOpened: number;
}
