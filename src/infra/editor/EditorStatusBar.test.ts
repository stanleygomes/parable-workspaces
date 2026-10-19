import { describe, expect, it, vi } from 'vitest';
import {
  StatusBarAlignment,
  statusBarItems,
  window,
  workspaceFoldersEmitter,
} from '../../test/unit/mocks/vscode';
import { EditorStatusBar } from './EditorStatusBar';

describe('EditorStatusBar', () => {
  it('creates a left aligned status bar item', () => {
    new EditorStatusBar();

    expect(window.createStatusBarItem).toHaveBeenCalledWith(
      StatusBarAlignment.Left,
      100,
    );
  });

  it('updates and shows the item', () => {
    const statusBar = new EditorStatusBar();

    statusBar.update('🚀 Api', 'Current Workspace: Api', 'some.command');

    expect(statusBarItems[0]).toMatchObject({
      text: '🚀 Api',
      tooltip: 'Current Workspace: Api',
      command: 'some.command',
    });
    expect(statusBarItems[0].show).toHaveBeenCalled();
  });

  it('hides and disposes the item', () => {
    const statusBar = new EditorStatusBar();

    statusBar.hide();
    statusBar.dispose();

    expect(statusBarItems[0].hide).toHaveBeenCalled();
    expect(statusBarItems[0].dispose).toHaveBeenCalled();
  });

  it('subscribes to workspace folder changes', () => {
    const statusBar = new EditorStatusBar();
    const callback = vi.fn();

    statusBar.onDidChangeWorkspaceFolders(callback);
    workspaceFoldersEmitter.fire();

    expect(callback).toHaveBeenCalledOnce();
  });
});
