import { describe, expect, it, vi } from 'vitest';
import { StringHelper } from '../helpers/StringHelper';
import { WorkspaceColors } from '../enums/WorkspaceColor';
import type { EditorTheme } from '../../infra/editor/EditorTheme';
import {
  buildRepository,
  buildUserInteraction,
  buildWorkspace,
} from '../../test/unit/fakes';
import { setWorkspace } from '../../test/unit/mocks/vscode';
import { UpdateWorkspaceColorService } from './UpdateWorkspaceColorService';

const CURRENT_ID = StringHelper.toBase64('/projects/current');
const red = WorkspaceColors.find((c) => c.description === 'Red')!;

function setup() {
  const { repository, stateManager } = buildRepository([
    buildWorkspace({ id: 'other', name: 'Other' }),
    buildWorkspace({ id: CURRENT_ID, name: 'Current' }),
  ]);
  const { fake, userInteraction } = buildUserInteraction();
  const editorTheme = { applyColor: vi.fn() };
  const service = new UpdateWorkspaceColorService(
    repository,
    editorTheme as unknown as EditorTheme,
    userInteraction,
  );
  return { service, stateManager, fake, editorTheme };
}

describe('UpdateWorkspaceColorService', () => {
  it('offers every available color', async () => {
    const { service, fake } = setup();

    await service.update('other');

    expect(fake.showQuickPick).toHaveBeenCalledWith(WorkspaceColors, {
      placeHolder: 'Select color for "Other"',
    });
  });

  it('saves the color without touching the editor for other workspaces', async () => {
    setWorkspace(['/projects/current']);
    const { service, stateManager, fake, editorTheme } = setup();
    fake.showQuickPick.mockResolvedValue(red);

    await service.update('other');

    expect(stateManager.workspaces[0]).toMatchObject({
      color: red.color,
      textColor: red.textColor,
    });
    expect(editorTheme.applyColor).not.toHaveBeenCalled();
  });

  it('applies the color to the editor for the current workspace', async () => {
    setWorkspace(['/projects/current']);
    const { service, fake, editorTheme } = setup();
    fake.showQuickPick.mockResolvedValue(red);

    await service.update(CURRENT_ID);

    expect(editorTheme.applyColor).toHaveBeenCalledWith(
      red.color,
      red.textColor,
    );
  });

  it('does nothing when the quick pick is cancelled', async () => {
    const { service, stateManager } = setup();

    await service.update('other');

    expect(stateManager.workspaces[0].color).toBeUndefined();
  });

  it('ignores unknown workspaces', async () => {
    const { service, fake } = setup();

    await service.update('missing');

    expect(fake.showQuickPick).not.toHaveBeenCalled();
  });
});
