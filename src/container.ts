import * as vscode from 'vscode';
import { WorkspaceRepository } from './core/repositories/WorkspaceRepository';
import { SaveWorkspaceService } from './service/SaveWorkspaceService';
import { OpenWorkspaceService } from './service/OpenWorkspaceService';
import { DeleteWorkspaceService } from './service/DeleteWorkspaceService';
import { FindWorkspaceService } from './service/FindWorkspaceService';
import { UpdateWorkspaceFavoriteService } from './service/UpdateWorkspaceFavoriteService';
import { SettingsService } from './service/SettingsService';
import { UpdateWorkspaceStatusBarService } from './service/UpdateWorkspaceStatusBarService';
import { UpdateWorkspaceNameService } from './core/services/UpdateWorkspaceNameService';
import { UpdateWorkspaceEmojiService } from './core/services/UpdateWorkspaceEmojiService';
import { UpdateWorkspaceColorService } from './core/services/UpdateWorkspaceColorService';
import { SwitchWorkspaceService } from './service/SwitchWorkspaceService';
import { SuggestSaveWorkspaceService } from './core/services/SuggestSaveWorkspaceService';
import { EditorTheme } from './infra/editor/EditorTheme';
import { EditorStatusBar } from './infra/editor/EditorStatusBar';
import { OpenWorkspacesFileService } from './service/OpenWorkspacesFileService';
import { WorkspaceStateManager } from './core/persistence/WorkspaceStateManager';
import { UserInteraction } from './infra/editor/UserInteraction';

export class Container {
  public readonly userInteraction: UserInteraction;
  public readonly workspaceStateManager: WorkspaceStateManager;
  public readonly workspaceRepository: WorkspaceRepository;
  public readonly settingsService: SettingsService;
  public readonly saveWorkspaceService: SaveWorkspaceService;
  public readonly openWorkspaceService: OpenWorkspaceService;
  public readonly deleteWorkspaceService: DeleteWorkspaceService;
  public readonly FindWorkspaceService: FindWorkspaceService;
  public readonly UpdateWorkspaceFavoriteService: UpdateWorkspaceFavoriteService;
  public readonly editorTheme: EditorTheme;
  public readonly UpdateWorkspaceNameService: UpdateWorkspaceNameService;
  public readonly UpdateWorkspaceEmojiService: UpdateWorkspaceEmojiService;
  public readonly UpdateWorkspaceColorService: UpdateWorkspaceColorService;
  public readonly switchWorkspaceService: SwitchWorkspaceService;
  public readonly suggestSaveWorkspaceService: SuggestSaveWorkspaceService;
  public readonly updateWorkspaceStatusBarService: UpdateWorkspaceStatusBarService;
  public readonly editorStatusBar: EditorStatusBar;
  public readonly OpenWorkspacesFileService: OpenWorkspacesFileService;

  constructor(context: vscode.ExtensionContext) {
    this.userInteraction = new UserInteraction();
    this.editorStatusBar = new EditorStatusBar();
    this.workspaceStateManager = new WorkspaceStateManager(context);
    this.workspaceRepository = new WorkspaceRepository(
      this.workspaceStateManager,
    );
    this.settingsService = new SettingsService(context);

    this.saveWorkspaceService = new SaveWorkspaceService(
      this.workspaceRepository,
      this.userInteraction,
    );
    this.openWorkspaceService = new OpenWorkspaceService(
      this.workspaceRepository,
      this.userInteraction,
    );
    this.deleteWorkspaceService = new DeleteWorkspaceService(
      this.workspaceRepository,
      this.userInteraction,
    );
    this.FindWorkspaceService = new FindWorkspaceService(
      this.workspaceRepository,
    );
    this.UpdateWorkspaceFavoriteService = new UpdateWorkspaceFavoriteService(
      this.workspaceRepository,
    );
    this.editorTheme = new EditorTheme(this.workspaceRepository);
    this.UpdateWorkspaceNameService = new UpdateWorkspaceNameService(
      this.workspaceRepository,
      this.userInteraction,
    );
    this.UpdateWorkspaceEmojiService = new UpdateWorkspaceEmojiService(
      this.workspaceRepository,
      this.userInteraction,
    );
    this.UpdateWorkspaceColorService = new UpdateWorkspaceColorService(
      this.workspaceRepository,
      this.editorTheme,
      this.userInteraction,
    );
    this.switchWorkspaceService = new SwitchWorkspaceService(
      this.workspaceRepository,
      this.openWorkspaceService,
      this.userInteraction,
    );
    this.suggestSaveWorkspaceService = new SuggestSaveWorkspaceService(
      this.workspaceRepository,
      this.saveWorkspaceService,
      this.userInteraction,
    );
    this.updateWorkspaceStatusBarService = new UpdateWorkspaceStatusBarService(
      this.workspaceRepository,
      this.editorStatusBar,
    );
    this.OpenWorkspacesFileService = new OpenWorkspacesFileService(
      this.workspaceStateManager,
      this.userInteraction,
    );
  }
}
