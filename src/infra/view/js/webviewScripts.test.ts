import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { describe, expect, it } from 'vitest';

interface WebviewFunctions {
  getInitials(name: string | undefined): string;
  escapeHtml(value: string | undefined): string;
  calculateMenuCoordinate(
    cursorPos: number,
    menuSize: number,
    viewportSize: number,
    padding?: number,
  ): number;
}

function loadScripts(...files: string[]): WebviewFunctions {
  const context = vm.createContext({});
  files.forEach((file) =>
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, file), 'utf8'),
      context,
    ),
  );
  return context as unknown as WebviewFunctions;
}

const scripts = loadScripts('utils.js', 'contextMenu.js');

describe('webview utils', () => {
  it.each([
    [undefined, 'WS'],
    ['', 'WS'],
    ['parable', 'PA'],
    ['payments api', 'PA'],
    ['  my   cool project ', 'MC'],
    ['x', 'X'],
  ])('builds initials for %o as %s', (name, expected) => {
    expect(scripts.getInitials(name)).toBe(expected);
  });

  it('escapes html special characters', () => {
    expect(scripts.escapeHtml('<a href="x">Tom & Jerry</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;',
    );
  });

  it('returns an empty string for missing values', () => {
    expect(scripts.escapeHtml(undefined)).toBe('');
  });
});

describe('context menu positioning', () => {
  it('keeps the cursor position when the menu fits', () => {
    expect(scripts.calculateMenuCoordinate(50, 100, 400)).toBe(50);
  });

  it('respects the minimum padding', () => {
    expect(scripts.calculateMenuCoordinate(1, 100, 400)).toBe(4);
  });

  it('flips the menu before the cursor when it overflows', () => {
    expect(scripts.calculateMenuCoordinate(350, 100, 400)).toBe(250);
  });

  it('pins the menu to the viewport edge when it cannot flip', () => {
    expect(scripts.calculateMenuCoordinate(80, 100, 150)).toBe(46);
  });

  it('never returns less than the padding for oversized menus', () => {
    expect(scripts.calculateMenuCoordinate(10, 500, 200)).toBe(4);
  });

  it('accepts a custom padding', () => {
    expect(scripts.calculateMenuCoordinate(0, 10, 100, 8)).toBe(8);
  });
});
