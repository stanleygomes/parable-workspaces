import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { join } from 'path';

const require = createRequire(__filename);
const { clampContextMenuPosition } = require(
  join(__dirname, './contextMenu.js'),
) as {
  clampContextMenuPosition: (
    x: number,
    y: number,
    menuWidth: number,
    menuHeight: number,
    viewportWidth: number,
    viewportHeight: number,
  ) => { left: number; top: number };
};

describe('Context menu viewport clamping', () => {
  it('keeps the requested position when the menu fits', () => {
    expect(clampContextMenuPosition(40, 80, 160, 200, 800, 600)).toEqual({
      left: 40,
      top: 80,
    });
  });

  it('moves the menu up when it would overflow the bottom edge', () => {
    expect(clampContextMenuPosition(20, 500, 160, 220, 400, 600)).toEqual({
      left: 20,
      top: 376,
    });
  });

  it('moves the menu left when it would overflow the right edge', () => {
    expect(clampContextMenuPosition(350, 40, 160, 120, 400, 600)).toEqual({
      left: 236,
      top: 40,
    });
  });

  it('clamps to the top-left padding when the menu is larger than the viewport', () => {
    expect(clampContextMenuPosition(10, 10, 500, 700, 400, 600)).toEqual({
      left: 4,
      top: 4,
    });
  });
});
