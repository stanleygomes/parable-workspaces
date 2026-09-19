import * as vscode from 'vscode';
import { SettingsKey } from '../../core/enums/SettingsKey';
import { ConfigurationKey } from '../../core/enums/ConfigurationKey';

export class SettingsStateManager {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public detectsIcons(): boolean {
    return vscode.workspace
      .getConfiguration()
      .get<boolean>(ConfigurationKey.DetectIcons, false);
  }

  public get<T>(key: SettingsKey, defaultValue: T): T {
    return this.context.globalState.get<T>(key, defaultValue);
  }

  public async set<T>(key: SettingsKey, value: T): Promise<void> {
    await this.context.globalState.update(key, value);
  }
}
