import * as vscode from 'vscode';
import { TemplateHelper } from '../../core/helpers/TemplateHelper';

const VIEW_ASSETS: string[][] = [
  ['src', 'infra', 'view', 'html', 'index.html'],
  ['src', 'infra', 'view', 'html', 'toolbar.html'],
  ['src', 'infra', 'view', 'html', 'filters.html'],
  ['src', 'infra', 'view', 'html', 'workspaces.html'],
  ['src', 'infra', 'view', 'css', 'main.css'],
  ['src', 'infra', 'view', 'js', 'utils.js'],
  ['src', 'infra', 'view', 'js', 'contextMenu.js'],
  ['src', 'infra', 'view', 'js', 'renderer.js'],
  ['src', 'infra', 'view', 'js', 'controller.js'],
];

export class HtmlTemplateBuilder {
  public static prefetch(extensionUri: vscode.Uri): void {
    TemplateHelper.prefetch(extensionUri, VIEW_ASSETS);
  }

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

    const js = (file: string) => render('js', `${file}.js`);

    return render('html', `${templateName}.html`, {
      nonce: nonce,
      cspSource: webview.cspSource,
      style: render('css', 'main.css'),
      script: [
        js('utils'),
        js('contextMenu'),
        js('renderer'),
        js('controller'),
      ].join('\n'),
      toolbar: render('html', 'toolbar.html'),
      filters: render('html', 'filters.html'),
      workspaces: render('html', 'workspaces.html'),
      initialPayload: extraVariables.initialPayload ?? 'null',
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
