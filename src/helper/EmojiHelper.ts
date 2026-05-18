import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface EmojiItem {
  label: string;
  description: string;
  emoji: string;
}

export class EmojiHelper {
  public static getEmojis(extensionUri: vscode.Uri): EmojiItem[] {
    try {
      const emojiPath = path.join(
        extensionUri.fsPath,
        'resources',
        'data',
        'emojis.json',
      );
      if (!fs.existsSync(emojiPath)) {
        return this.getFallbackEmojis();
      }

      const content = fs.readFileSync(emojiPath, 'utf8');
      const emojiData = JSON.parse(content);

      return Object.entries(emojiData).map(([emoji, data]: [string, any]) => ({
        label: emoji,
        description: data.name,
        emoji: emoji,
      }));
    } catch (e) {
      console.error('Error loading emojis', e);
      return this.getFallbackEmojis();
    }
  }

  private static getFallbackEmojis(): EmojiItem[] {
    return [
      { label: '🚀', description: 'Rocket', emoji: '🚀' },
      { label: '🛠️', description: 'Tools', emoji: '🛠️' },
      { label: '📚', description: 'Books', emoji: '📚' },
    ];
  }
}
