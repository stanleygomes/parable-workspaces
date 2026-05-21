import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { Workspace } from '../dto/Workspace';
import { DialogHelper } from '../helper/DialogHelper';
import { ZipHelper } from '../helper/ZipHelper';
import { FileHelper } from '../helper/FileHelper';

export class ExportZipService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async exportZip(workspaces: Workspace[]): Promise<void> {
    if (workspaces.length === 0) {
      DialogHelper.showError('No workspaces to export.');
      return;
    }

    const saveUri = await DialogHelper.showSaveDialog({
      filters: { 'ZIP Archive': ['zip'] },
      defaultUri: undefined,
    });

    if (!saveUri) {
      return;
    }

    const tempDir = path.join(this.repository.getStoragePath(), 'temp-export');
    FileHelper.mkdir(tempDir);

    const tempFilePaths: string[] = [];
    const usedNames = new Set<string>();

    for (const workspace of workspaces) {
      const safeName = workspace.name.replace(/[^a-z0-9-_]/gi, '_');
      let uniqueName = safeName;
      let counter = 1;

      while (usedNames.has(uniqueName.toLowerCase())) {
        uniqueName = `${safeName}_${counter}`;
        counter++;
      }
      usedNames.add(uniqueName.toLowerCase());

      const fileName = `${uniqueName}.code-workspace`;
      const filePath = path.join(tempDir, fileName);

      const content = {
        folders: workspace.folders.map((f) => ({ path: f })),
        settings: {},
      };

      FileHelper.writeText(filePath, JSON.stringify(content, null, 2));
      tempFilePaths.push(filePath);
    }

    try {
      await ZipHelper.createZipFromFiles(tempFilePaths, saveUri.fsPath);
      DialogHelper.showInfo(
        `All workspaces successfully exported to ${saveUri.fsPath}`,
      );
    } catch (error) {
      DialogHelper.showError(`Error creating ZIP archive: ${error}`);
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (rmError) {
        console.error('Error cleaning up temporary export folder:', rmError);
      }
    }
  }
}
