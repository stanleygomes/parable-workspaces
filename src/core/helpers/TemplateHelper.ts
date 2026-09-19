import * as vscode from 'vscode';
import { FileHelper } from './FileHelper';
import { StringHelper } from './StringHelper';

export class TemplateHelper {
  private static readonly contentCache = new Map<string, string>();

  public static prefetch(
    extensionUri: vscode.Uri,
    templatePaths: string[][],
  ): void {
    for (const templatePath of templatePaths) {
      this.readCached(extensionUri, templatePath);
    }
  }

  public static clearCache(): void {
    this.contentCache.clear();
  }

  public static render(
    extensionUri: vscode.Uri,
    templatePath: string[],
    variables: Record<string, string> = {},
  ): string {
    const content = this.readCached(extensionUri, templatePath);

    if (!content) {
      const fullPath = FileHelper.buildPath(
        extensionUri.fsPath,
        ...templatePath,
      );
      console.error(`Template not found or empty: ${fullPath}`);
      return `<!-- Error: Template not found at ${fullPath} -->`;
    }

    return StringHelper.replace(content, variables);
  }

  private static readCached(
    extensionUri: vscode.Uri,
    templatePath: string[],
  ): string {
    const fullPath = FileHelper.buildPath(extensionUri.fsPath, ...templatePath);
    const cached = this.contentCache.get(fullPath);
    if (cached !== undefined) {
      return cached;
    }

    const content = FileHelper.readText(fullPath);
    this.contentCache.set(fullPath, content);
    return content;
  }
}
