import * as vscode from 'vscode';
import { FileHelper } from './FileHelper';

export interface EmojiItem {
  label: string;
  description: string;
  emoji: string;
}

export class EmojiHelper {
  public static getEmojis(extensionUri: vscode.Uri): EmojiItem[] {
    try {
      const emojiPath = FileHelper.buildPath(
        extensionUri.fsPath,
        'resources',
        'data',
        'emojis.json',
      );
      if (!FileHelper.exists(emojiPath)) {
        return [];
      }

      const content = FileHelper.readText(emojiPath);
      const emojiData = JSON.parse(content);

      return Object.entries(emojiData).map(([emoji, data]: [string, any]) => ({
        label: emoji,
        description: data.name,
        emoji: emoji,
      }));
    } catch (e) {
      console.error('Error loading emojis', e);
      return [];
    }
  }
}
