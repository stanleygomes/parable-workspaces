import * as vscode from 'vscode';
import { FileHelper } from './FileHelper';
import { StringHelper } from './StringHelper';

export class TemplateHelper {
  /**
   * Renders a template by reading its content and replacing placeholders.
   *
   * @param extensionUri The URI of the extension.
   * @param templatePath Array of path parts relative to the extension root (e.g., ['resources', 'templates', 'html', 'index.html']).
   * @param variables A map of placeholders to their values (e.g., { 'nonce': 'abc' }).
   * @returns The rendered template string.
   */
  public static render(
    extensionUri: vscode.Uri,
    templatePath: string[],
    variables: Record<string, string> = {},
  ): string {
    const fullPath = FileHelper.buildPath(extensionUri.fsPath, ...templatePath);
    const content = FileHelper.readText(fullPath);

    if (!content) {
      console.error(`Template not found or empty: ${fullPath}`);
      return `<!-- Error: Template not found at ${fullPath} -->`;
    }

    return StringHelper.replace(content, variables);
  }
}
