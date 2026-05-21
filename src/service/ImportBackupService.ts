import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { DialogHelper } from '../helper/DialogHelper';
import { FileHelper } from '../helper/FileHelper';

export class ImportBackupService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async importBackup(): Promise<void> {
    const uris = await DialogHelper.showOpenDialog({
      canSelectFiles: true,
      canSelectMany: false,
      filters: { 'JSON Backup': ['json'] },
    });

    if (!uris || uris.length === 0) {
      return;
    }

    const uri = uris[0];
    try {
      const fileContent = FileHelper.readText(uri.fsPath);
      const backupData = JSON.parse(fileContent);

      if (!backupData || !Array.isArray(backupData.workspaces)) {
        DialogHelper.showError(
          'Invalid backup file: "workspaces" array not found.',
        );
        return;
      }

      const existingWorkspaces = this.repository.getAll();
      let addedCount = 0;
      let updatedCount = 0;

      for (const workspace of backupData.workspaces) {
        if (
          !workspace.id ||
          !workspace.name ||
          !Array.isArray(workspace.folders)
        ) {
          continue;
        }

        const exists = existingWorkspaces.some((w) => w.id === workspace.id);
        if (exists) {
          updatedCount++;
        } else {
          addedCount++;
        }
      }

      await this.repository.saveAll(backupData.workspaces);
      DialogHelper.showInfo(
        `Backup imported successfully! (${addedCount} added, ${updatedCount} updated)`,
      );
    } catch (error) {
      DialogHelper.showError(`Error importing backup: ${error}`);
    }
  }
}
