import { describe, expect, it } from 'vitest';
import type * as vscode from 'vscode';
import { commands, window, workspace } from '../../test/unit/mocks/vscode';
import { Uri as FakeUri } from '../../test/unit/mocks/vscode';

const Uri = {
  file: (path: string) => FakeUri.file(path) as unknown as vscode.Uri,
};
import { UserInteraction } from './UserInteraction';

describe('UserInteraction', () => {
  const userInteraction = new UserInteraction();

  it('delegates input boxes to the editor', async () => {
    window.showInputBox.mockResolvedValue('typed');

    await expect(userInteraction.showInputBox({ prompt: 'p' })).resolves.toBe(
      'typed',
    );
    expect(window.showInputBox).toHaveBeenCalledWith({ prompt: 'p' });
  });

  it.each([
    ['Yes', true],
    ['No', false],
    [undefined, false],
  ])('maps confirmation answer %s to %s', async (answer, expected) => {
    window.showWarningMessage.mockResolvedValue(answer);

    await expect(userInteraction.showConfirmation('Sure?')).resolves.toBe(
      expected,
    );
    expect(window.showWarningMessage).toHaveBeenCalledWith(
      'Sure?',
      'Yes',
      'No',
    );
  });

  it('delegates quick picks to the editor', async () => {
    const items = [{ label: 'a' }];
    window.showQuickPick.mockResolvedValue(items[0]);

    await expect(
      userInteraction.showQuickPick(items, { placeHolder: 'pick' }),
    ).resolves.toBe(items[0]);
  });

  it('shows error and info messages', async () => {
    window.showInformationMessage.mockResolvedValue('Ok');

    userInteraction.showError('bad');
    const answer = await userInteraction.showInfo('good', 'Ok', 'Cancel');

    expect(window.showErrorMessage).toHaveBeenCalledWith('bad');
    expect(window.showInformationMessage).toHaveBeenCalledWith(
      'good',
      'Ok',
      'Cancel',
    );
    expect(answer).toBe('Ok');
  });

  it('executes commands with arguments', async () => {
    commands.executeCommand.mockResolvedValue('result');

    await expect(userInteraction.executeCommand('cmd', 1, 2)).resolves.toBe(
      'result',
    );
    expect(commands.executeCommand).toHaveBeenCalledWith('cmd', 1, 2);
  });

  it('delegates open and save dialogs', async () => {
    const uri = Uri.file('/tmp/file');
    window.showOpenDialog.mockResolvedValue([uri]);
    window.showSaveDialog.mockResolvedValue(uri);

    await expect(userInteraction.showOpenDialog({})).resolves.toEqual([uri]);
    await expect(userInteraction.showSaveDialog({})).resolves.toBe(uri);
  });

  it('opens and shows a text document', async () => {
    const uri = Uri.file('/config/workspaces.json');

    await userInteraction.openTextDocument(uri);

    expect(workspace.openTextDocument).toHaveBeenCalledWith(uri);
    expect(window.showTextDocument).toHaveBeenCalledWith({ uri });
  });

  it.each([
    [undefined, false],
    [true, true],
  ])('opens folders with forceNewWindow=%s', async (flag, expected) => {
    await userInteraction.openFolder('/projects/api', flag);

    expect(commands.executeCommand).toHaveBeenCalledWith(
      'vscode.openFolder',
      Uri.file('/projects/api'),
      expected,
    );
  });
});
