import * as vscode from 'vscode';
import { TemplateHelper } from '../core/helpers/TemplateHelper';

export class WebviewHelper {
  public static getHtml(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    templateName: string = 'index',
    extraVariables: Record<string, string> = {},
  ): string {
    const nonce = this.generateNonce();

    const style = TemplateHelper.render(extensionUri, [
      'src',
      'infra',
      'view',
      'css',
      'main.css',
    ]);

    const script = TemplateHelper.render(extensionUri, [
      'src',
      'infra',
      'view',
      'js',
      'index.js',
    ]);

    const toolbar = TemplateHelper.render(extensionUri, [
      'src',
      'infra',
      'view',
      'html',
      'toolbar.html',
    ]);

    const filters = TemplateHelper.render(extensionUri, [
      'src',
      'infra',
      'view',
      'html',
      'filters.html',
    ]);

    const workspaces = TemplateHelper.render(extensionUri, [
      'src',
      'infra',
      'view',
      'html',
      'workspaces.html',
    ]);

    return TemplateHelper.render(
      extensionUri,
      ['src', 'infra', 'view', 'html', `${templateName}.html`],
      {
        nonce: nonce,
        style: style,
        script: script,
        toolbar: toolbar,
        filters: filters,
        workspaces: workspaces,
        ...extraVariables,
      },
    );
  }

  /**
   * Generates a random 32-character alphanumeric nonce for Content Security Policy (CSP).
   *
   * @returns A random 32-character string.
   */
  private static generateNonce(): string {
    let text = '';
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
