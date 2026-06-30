import * as vscode from 'vscode';
import { TemplateHelper } from '../../core/helpers/TemplateHelper';

export class HtmlTemplateBuilder {
  public static build(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    templateName: string = 'index',
    extraVariables: Record<string, string> = {},
  ): string {
    const nonce = this.generateNonce();
    const render = (
      folder: string,
      file: string,
      vars: Record<string, string> = {},
    ) =>
      TemplateHelper.render(
        extensionUri,
        ['src', 'infra', 'view', folder, file],
        vars,
      );

    return render('html', `${templateName}.html`, {
      nonce: nonce,
      style: render('css', 'main.css'),
      script: render('js', 'index.js'),
      toolbar: render('html', 'toolbar.html'),
      filters: render('html', 'filters.html'),
      workspaces: render('html', 'workspaces.html'),
      ...extraVariables,
    });
  }

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
