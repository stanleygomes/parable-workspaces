import * as vscode from 'vscode';
import { Workspace } from '../../dto/Workspace';

export class WorkspaceStateStorage {
  private static readonly STORAGE_KEY = 'savedProjects';

  constructor(private readonly context: vscode.ExtensionContext) {
    if (context.globalState.setKeysForSync) {
      context.globalState.setKeysForSync([WorkspaceStateStorage.STORAGE_KEY]);
    }
  }

  public read(): Workspace[] {
    return this.context.globalState.get<Workspace[]>(
      WorkspaceStateStorage.STORAGE_KEY,
      [],
    );
  }

  public async write(workspaces: Workspace[]): Promise<void> {
    await this.context.globalState.update(
      WorkspaceStateStorage.STORAGE_KEY,
      workspaces,
    );
  }
}
