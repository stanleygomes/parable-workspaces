import * as fs from 'fs';
import { Workspace } from '../dto/Workspace';
import { DialogHelper } from '../helper/DialogHelper';

export class ExportWorkspaceService {
  async export(workspace: Workspace): Promise<void> {
    const saveUri = await DialogHelper.showSaveDialog({
      filters: { 'VS Code Workspace': ['code-workspace'] },
      defaultUri: undefined,
    });

    if (!saveUri) {
      return;
    }

    const content = {
      folders: workspace.folders.map((f) => ({ path: f })),
      settings: {},
    };

    try {
      fs.writeFileSync(
        saveUri.fsPath,
        JSON.stringify(content, null, 2),
        'utf8',
      );
      DialogHelper.showInfo(
        `Workspace successfully exported to ${saveUri.fsPath}`,
      );
    } catch (error) {
      DialogHelper.showError(`Error exporting workspace: ${error}`);
    }
  }
}
