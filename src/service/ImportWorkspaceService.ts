import * as path from 'path';
import { WorkspaceRepository } from '../repository/WorkspaceRepository';
import { Workspace } from '../dto/Workspace';
import { DialogHelper } from '../helper/DialogHelper';
import { FileHelper } from '../helper/FileHelper';

export class ImportWorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async import(): Promise<void> {
    const uris = await DialogHelper.showOpenDialog({
      canSelectFiles: true,
      canSelectMany: false,
      filters: { 'VS Code Workspace': ['code-workspace'] },
    });

    if (!uris || uris.length === 0) {
      return;
    }

    const uri = uris[0];
    try {
      const fileContent = FileHelper.readText(uri.fsPath);
      const workspaceData = JSON.parse(fileContent);

      if (!workspaceData.folders) {
        DialogHelper.showError(
          'Invalid workspace file: "folders" field not found.',
        );
        return;
      }

      const baseDir = path.dirname(uri.fsPath);
      const folders = workspaceData.folders.map((f: any) => {
        const folderPath = f.path || f.uri; // VS Code supports both
        if (path.isAbsolute(folderPath)) {
          return folderPath;
        }
        return path.resolve(baseDir, folderPath);
      });

      const name = path.basename(uri.fsPath, '.code-workspace');
      const workspace: Workspace = {
        id: Buffer.from(uri.fsPath).toString('base64'),
        name: name,
        folders: folders,
        lastOpened: Date.now(),
        tags: [],
      };

      await this.repository.save(workspace);
      DialogHelper.showInfo(`Workspace "${name}" imported successfully!`);
    } catch (error) {
      DialogHelper.showError(`Error importing workspace: ${error}`);
    }
  }
}
