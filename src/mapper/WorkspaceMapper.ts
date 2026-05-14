import { Workspace } from '../dto/Workspace';
import { DateHelper } from '../helper/DateHelper';

export class WorkspaceMapper {
  public static toWebview(workspace: Workspace) {
    return {
      ...workspace,
      dateLabel: DateHelper.toHumanRelative(workspace.lastOpened),
      foldersCount: workspace.folders.length,
      primaryFolder: workspace.folders[0] || '',
    };
  }
}

