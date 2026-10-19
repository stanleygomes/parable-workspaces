import { describe, expect, it } from 'vitest';
import { StringHelper } from '../../core/helpers/StringHelper';
import { buildRepository, buildWorkspace } from '../../test/unit/fakes';
import {
  ConfigurationTarget,
  configurationStore,
  setWorkspace,
  workspace,
} from '../../test/unit/mocks/vscode';
import { EditorTheme } from './EditorTheme';

const CURRENT_ID = StringHelper.toBase64('/projects/current');
const COLOR_KEY = 'workbench.colorCustomizations';

function setup(initial = [buildWorkspace({ id: CURRENT_ID })]) {
  const { repository } = buildRepository(initial);
  return new EditorTheme(repository);
}

describe('EditorTheme', () => {
  it('applies the color to the status bar keeping unrelated customizations', async () => {
    configurationStore.set(COLOR_KEY, {
      'editor.background': '#000000',
      'titleBar.activeBackground': '#ff0000',
    });

    await setup().applyColor('#3498db', '#111111');

    expect(configurationStore.get(COLOR_KEY)).toEqual({
      'editor.background': '#000000',
      'statusBar.background': '#3498db',
      'statusBar.foreground': '#111111',
      'statusBarItem.remoteBackground': '#3498db',
      'statusBarItem.remoteForeground': '#111111',
    });
  });

  it('writes to the workspace configuration target', async () => {
    await setup().applyColor('#3498db', '#ffffff');

    const config = workspace.getConfiguration.mock.results[0].value;
    expect(config.update).toHaveBeenCalledWith(
      'colorCustomizations',
      expect.any(Object),
      ConfigurationTarget.Workspace,
    );
  });

  it('defaults the text color to white', async () => {
    await setup().applyColor('#3498db', undefined);

    expect(configurationStore.get(COLOR_KEY)).toMatchObject({
      'statusBar.foreground': '#ffffff',
      'statusBarItem.remoteForeground': '#ffffff',
    });
  });

  it('removes managed customizations when the color is cleared', async () => {
    configurationStore.set(COLOR_KEY, {
      'statusBar.background': '#3498db',
      'activityBar.background': '#3498db',
      'editor.background': '#000000',
    });

    await setup().applyColor('', '');

    expect(configurationStore.get(COLOR_KEY)).toEqual({
      'editor.background': '#000000',
    });
  });

  it('applies the saved color of the current workspace', async () => {
    setWorkspace(['/projects/current']);
    const theme = setup([
      buildWorkspace({ id: CURRENT_ID, color: '#e74c3c', textColor: '#fff' }),
    ]);

    await theme.applyCurrentWorkspaceColor();

    expect(configurationStore.get(COLOR_KEY)).toMatchObject({
      'statusBar.background': '#e74c3c',
    });
  });

  it('leaves the editor untouched when the current workspace has no color', async () => {
    setWorkspace(['/projects/current']);

    await setup().applyCurrentWorkspaceColor();

    expect(workspace.getConfiguration).not.toHaveBeenCalled();
  });

  it('leaves the editor untouched without an open folder', async () => {
    await setup().applyCurrentWorkspaceColor();

    expect(workspace.getConfiguration).not.toHaveBeenCalled();
  });
});
