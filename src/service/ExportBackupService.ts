import { Workspace } from '../dto/Workspace';
import { DialogHelper } from '../helper/DialogHelper';
import { FileHelper } from '../helper/FileHelper';

export class ExportBackupService {
  async exportAll(workspaces: Workspace[]): Promise<void> {
    const saveUri = await DialogHelper.showSaveDialog({
      filters: { 'JSON Backup': ['json'] },
      defaultUri: undefined,
    });

    if (!saveUri) {
      return;
    }

    const backupData = {
      version: 1,
      workspaces,
    };

    try {
      FileHelper.writeText(saveUri.fsPath, JSON.stringify(backupData, null, 2));
      DialogHelper.showInfo(
        `Backup successfully exported to ${saveUri.fsPath}`,
      );
    } catch (error) {
      DialogHelper.showError(`Error exporting backup: ${error}`);
    }
  }
}
