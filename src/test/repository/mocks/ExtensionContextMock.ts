import * as vscode from 'vscode';

export class MementoMock implements vscode.Memento {
  private readonly storage = new Map<string, any>();
  public keysForSync: string[] = [];

  public keys(): readonly string[] {
    return Array.from(this.storage.keys());
  }

  public get<T>(key: string): T | undefined;
  public get<T>(key: string, defaultValue: T): T;
  public get(key: any, defaultValue?: any): any {
    return this.storage.has(key) ? this.storage.get(key) : defaultValue;
  }

  public async update(key: string, value: any): Promise<void> {
    if (value === undefined) {
      this.storage.delete(key);
    } else {
      this.storage.set(key, value);
    }
  }

  public setKeysForSync(keys: string[]): void {
    this.keysForSync = keys;
  }
}

export class ExtensionContextMock {
  public readonly globalState = new MementoMock();
  public readonly workspaceState = new MementoMock();
  public readonly subscriptions: { dispose(): any }[] = [];
  public readonly globalStorageUri: vscode.Uri;
  public readonly extensionUri: vscode.Uri;
  public readonly secrets = {} as vscode.SecretStorage;
  public readonly extensionMode = 1 as vscode.ExtensionMode;
  public readonly extensionPath = '';
  public readonly environmentVariableCollection =
    {} as vscode.EnvironmentVariableCollection;

  constructor(globalStoragePath: string) {
    this.globalStorageUri = vscode.Uri.file(globalStoragePath);
    this.extensionUri = vscode.Uri.file('/mock/extension/path');
  }
}
