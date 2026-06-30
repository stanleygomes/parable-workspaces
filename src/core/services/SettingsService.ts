import * as vscode from 'vscode';

export enum SettingsKey {
  ShowOnlyFavorites = 'showOnlyFavorites',
  SortType = 'sortType',
  ShowFilters = 'showFilters',
}

export class SettingsService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public get<T>(key: SettingsKey, defaultValue: T): T {
    return this.context.globalState.get<T>(key, defaultValue);
  }

  public async set<T>(key: SettingsKey, value: T): Promise<void> {
    await this.context.globalState.update(key, value);
  }
}
