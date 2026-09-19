import * as vscode from 'vscode';
import { StringHelper } from '../../core/helpers/StringHelper';
import { Workspace } from '../../core/dtos/Workspace';

export class EditorContext {
  private static getActiveFolders():
    | readonly vscode.WorkspaceFolder[]
    | undefined {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders : undefined;
  }

  public static getCurrentWorkspaceFile(): string | undefined {
    const workspaceFile = vscode.workspace.workspaceFile;
    if (!workspaceFile || workspaceFile.scheme !== 'file') {
      return undefined;
    }
    return workspaceFile.fsPath;
  }

  public static getCurrentWorkspaceId(): string | undefined {
    const folders = this.getActiveFolders();
    if (!folders) {
      return undefined;
    }

    const primaryFolder = folders[0];
    const workspaceFile = this.getCurrentWorkspaceFile();

    return StringHelper.toBase64(workspaceFile || primaryFolder.uri.fsPath);
  }

  public static getCurrentWorkspaceFolders(): string[] {
    const folders = this.getActiveFolders();
    if (!folders) {
      return [];
    }
    return folders.map((f) => f.uri.fsPath);
  }

  public static getCurrentWorkspaceName(): string | undefined {
    const folders = this.getActiveFolders();
    if (!folders) {
      return undefined;
    }

    const primaryFolder = folders[0];
    const workspaceFile = this.getCurrentWorkspaceFile();

    return workspaceFile
      ? vscode.workspace.name || primaryFolder.name
      : primaryFolder.name;
  }

  public static resolveOpenPath(workspace: Workspace): string | undefined {
    if (workspace.workspaceFile) {
      return workspace.workspaceFile;
    }

    try {
      const decodedId = StringHelper.fromBase64(workspace.id);
      if (decodedId.toLowerCase().endsWith('.code-workspace')) {
        return decodedId;
      }
    } catch {
      // Ignore invalid ids and fall back to the primary folder.
    }

    return workspace.folders[0];
  }
}
