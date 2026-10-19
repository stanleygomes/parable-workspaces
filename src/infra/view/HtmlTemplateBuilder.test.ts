import { describe, expect, it } from 'vitest';
import type { Uri as VscodeUri, Webview } from 'vscode';
import { Uri } from '../../test/unit/mocks/vscode';
import { HtmlTemplateBuilder } from './HtmlTemplateBuilder';

const extensionUri = Uri.file(process.cwd()) as unknown as VscodeUri;
const webview = {} as Webview;

function build(): string {
  return HtmlTemplateBuilder.build(webview, extensionUri);
}

describe('HtmlTemplateBuilder', () => {
  it('renders the full sidebar without leftover placeholders', () => {
    const html = build();

    expect(html).toContain('<title>Parable Workspaces</title>');
    expect(html).toContain('id="workspacesList"');
    expect(html).not.toMatch(/{{\w+}}/);
  });

  it('inlines every webview script', () => {
    const html = build();

    expect(html).toContain('function getInitials');
    expect(html).toContain('function showContextMenu');
    expect(html).toContain('function renderWorkspaces');
    expect(html).toContain('class WorkspacesViewController');
  });

  it('protects scripts and styles with the same random nonce', () => {
    const html = build();
    const nonces = [
      ...html.matchAll(/(?:'nonce-|nonce=")([A-Za-z0-9]{32})/g),
    ].map((match) => match[1]);

    expect(nonces).toHaveLength(4);
    expect(new Set(nonces).size).toBe(1);
    expect(build()).not.toContain(nonces[0]);
  });

  it('lets extra variables override defaults', () => {
    const html = HtmlTemplateBuilder.build(webview, extensionUri, 'index', {
      toolbar: '<div id="custom-toolbar"></div>',
    });

    expect(html).toContain('id="custom-toolbar"');
  });
});
