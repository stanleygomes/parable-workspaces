import * as path from 'path';
import * as vscode from 'vscode';
import { WorkspaceRepository } from './core/repositories/WorkspaceRepository';
import { SaveWorkspaceService } from './core/services/SaveWorkspaceService';
import { OpenWorkspaceService } from './core/services/OpenWorkspaceService';
import { DeleteWorkspaceService } from './core/services/DeleteWorkspaceService';
import { FindWorkspaceService } from './core/services/FindWorkspaceService';
import { UpdateWorkspaceFavoriteService } from './core/services/UpdateWorkspaceFavoriteService';
import { SettingsStateManager } from './infra/persistence/SettingsStateManager';
import { UpdateWorkspaceStatusBarService } from './core/services/UpdateWorkspaceStatusBarService';
import { UpdateWorkspaceNameService } from './core/services/UpdateWorkspaceNameService';
import { UpdateWorkspaceEmojiService } from './core/services/UpdateWorkspaceEmojiService';
import { UpdateWorkspaceIconService } from './core/services/UpdateWorkspaceIconService';
import { UpdateWorkspaceColorService } from './core/services/UpdateWorkspaceColorService';
import { SwitchWorkspaceService } from './core/services/SwitchWorkspaceService';
import { SuggestSaveWorkspaceService } from './core/services/SuggestSaveWorkspaceService';
import { EditorTheme } from './infra/editor/EditorTheme';
import { EditorStatusBar } from './infra/editor/EditorStatusBar';
import { OpenWorkspacesFileService } from './core/services/OpenWorkspacesFileService';
import { WorkspaceStateManager } from './infra/persistence/WorkspaceStateManager';
import { WorkspaceIconCache } from './infra/persistence/WorkspaceIconCache';
import { UserInteraction } from './infra/editor/UserInteraction';

export class Container {
  public readonly userInteraction: UserInteraction;
  public readonly workspaceStateManager: WorkspaceStateManager;
  public readonly workspaceRepository: WorkspaceRepository;
  public readonly workspaceIconCache: WorkspaceIconCache;
  public readonly SettingsStateManager: SettingsStateManager;
  public readonly saveWorkspaceService: SaveWorkspaceService;
  public readonly openWorkspaceService: OpenWorkspaceService;
  public readonly deleteWorkspaceService: DeleteWorkspaceService;
  public readonly FindWorkspaceService: FindWorkspaceService;
  public readonly UpdateWorkspaceFavoriteService: UpdateWorkspaceFavoriteService;
  public readonly editorTheme: EditorTheme;
  public readonly UpdateWorkspaceNameService: UpdateWorkspaceNameService;
  public readonly UpdateWorkspaceEmojiService: UpdateWorkspaceEmojiService;
  public readonly UpdateWorkspaceIconService: UpdateWorkspaceIconService;
  public readonly UpdateWorkspaceColorService: UpdateWorkspaceColorService;
  public readonly switchWorkspaceService: SwitchWorkspaceService;
  public readonly suggestSaveWorkspaceService: SuggestSaveWorkspaceService;
  public readonly updateWorkspaceStatusBarService: UpdateWorkspaceStatusBarService;
  public readonly editorStatusBar: EditorStatusBar;
  public readonly OpenWorkspacesFileService: OpenWorkspacesFileService;
  public readonly webviewIconCacheDir: string;

  constructor(context: vscode.ExtensionContext) {
    this.userInteraction = new UserInteraction();
    this.editorStatusBar = new EditorStatusBar();
    this.workspaceStateManager = new WorkspaceStateManager(context);
    this.workspaceRepository = new WorkspaceRepository(
      this.workspaceStateManager,
    );
    this.workspaceIconCache = new WorkspaceIconCache(context);
    this.SettingsStateManager = new SettingsStateManager(context);
    this.webviewIconCacheDir = path.join(
      context.globalStorageUri.fsPath,
      'webview-icons',
    );

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
    this.UpdateWorkspaceIconService = new UpdateWorkspaceIconService(
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
      this.workspaceIconCache,
      this.SettingsStateManager,
      path.join(context.globalStorageUri.fsPath, 'quickpick-icons'),
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
