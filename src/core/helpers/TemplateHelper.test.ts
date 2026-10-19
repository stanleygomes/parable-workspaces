import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Uri } from 'vscode';
import { TemplateHelper } from './TemplateHelper';

describe('TemplateHelper', () => {
  let extensionDir: string;

  beforeEach(() => {
    extensionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parable-tpl-'));
    fs.mkdirSync(path.join(extensionDir, 'templates'));
    fs.writeFileSync(
      path.join(extensionDir, 'templates', 'page.html'),
      '<p>{{title}}</p>',
    );
  });

  afterEach(() => {
    fs.rmSync(extensionDir, { recursive: true, force: true });
  });

  it('renders a template replacing its variables', () => {
    const html = TemplateHelper.render(
      Uri.file(extensionDir),
      ['templates', 'page.html'],
      { title: 'Hello' },
    );

    expect(html).toBe('<p>Hello</p>');
  });

  it('returns raw content when no variables are given', () => {
    const html = TemplateHelper.render(Uri.file(extensionDir), [
      'templates',
      'page.html',
    ]);

    expect(html).toBe('<p>{{title}}</p>');
  });

  it('returns an html comment when the template is missing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const html = TemplateHelper.render(Uri.file(extensionDir), [
      'templates',
      'missing.html',
    ]);

    expect(html).toContain('<!-- Error: Template not found at');
    expect(html).toContain('missing.html');
  });
});
