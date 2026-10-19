import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Sidebar spacing', () => {
  const css = readFileSync(
    join(__dirname, './css/main.css'),
    'utf8',
  );
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../../../package.json'), 'utf8'),
  );

  it('tightens horizontal padding to better match Explorer gutters', () => {
    expect(css).toContain('padding: 0 5px !important');
    expect(css).toContain('padding-left: 8px !important');
    expect(css).toMatch(/\.toolbar\s*\{[^}]*padding:\s*6px 4px/s);
    expect(css).toMatch(/\.filter-row\s*\{[^}]*padding:\s*6px 4px/s);
    expect(css).toMatch(/\.workspace-body\s*\{[^}]*padding:\s*10px 4px/s);
    expect(css).toMatch(/\.empty-state\s*\{[^}]*padding:\s*40px 4px/s);
    expect(css).toMatch(/\.save-banner\s*\{[^}]*padding:\s*12px 4px/s);
    expect(css).toMatch(
      /\.workspace-item\.design-emoji-ring\s*\{[^}]*padding-left:\s*0/s,
    );
  });

  it('keeps a single Open workspaces.json and Refresh view/title pair', () => {
    const menus = packageJson.contributes.menus['view/title'];
    const open = menus.filter(
      (item: { command: string }) =>
        item.command === 'workspaceManager.openConfigFile',
    );
    const refresh = menus.filter(
      (item: { command: string }) =>
        item.command === 'workspaceManager.refreshWorkspaces',
    );

    expect(open).toHaveLength(1);
    expect(refresh).toHaveLength(1);
    expect(menus).toHaveLength(2);
  });
});
