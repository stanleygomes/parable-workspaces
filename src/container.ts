import * as vscode from 'vscode';
import { WorkspaceRepository } from './repository/WorkspaceRepository';
import { SaveWorkspaceService } from './service/SaveWorkspaceService';
import { OpenWorkspaceService } from './service/OpenWorkspaceService';
import { DeleteWorkspaceService } from './service/DeleteWorkspaceService';
import { SearchWorkspaceService } from './service/SearchWorkspaceService';
import { FavoriteWorkspaceService } from './service/FavoriteWorkspaceService';
import { SettingsService } from './service/SettingsService';
import { StatusBarService } from './service/StatusBarService';
import { EditNameWorkspaceService } from './service/EditNameWorkspaceService';
import { ChangeEmojiWorkspaceService } from './service/ChangeEmojiWorkspaceService';
import { ChangeColorWorkspaceService } from './service/ChangeColorWorkspaceService';
import { QuickPickService } from './service/QuickPickService';
import { NotificationCreateWorkspaceService } from './service/NotificationCreateWorkspaceService';
import { ColorService } from './service/ColorService';
import { OpenConfigFileService } from './service/OpenConfigFileService';

export class Container {
  public readonly workspaceRepository: WorkspaceRepository;
  public readonly settingsService: SettingsService;
  public readonly saveWorkspaceService: SaveWorkspaceService;
  public readonly openWorkspaceService: OpenWorkspaceService;
  public readonly deleteWorkspaceService: DeleteWorkspaceService;
  public readonly searchWorkspaceService: SearchWorkspaceService;
  public readonly favoriteWorkspaceService: FavoriteWorkspaceService;
  public readonly colorService: ColorService;
  public readonly editNameWorkspaceService: EditNameWorkspaceService;
  public readonly changeEmojiWorkspaceService: ChangeEmojiWorkspaceService;
  public readonly changeColorWorkspaceService: ChangeColorWorkspaceService;
  public readonly quickPickService: QuickPickService;
  public readonly notificationCreateWorkspaceService: NotificationCreateWorkspaceService;
  public readonly statusBarService: StatusBarService;
  public readonly openConfigFileService: OpenConfigFileService;

  constructor(context: vscode.ExtensionContext) {
    this.workspaceRepository = new WorkspaceRepository(context);
    this.settingsService = new SettingsService(context);

    this.saveWorkspaceService = new SaveWorkspaceService(
      this.workspaceRepository,
    );
    this.openWorkspaceService = new OpenWorkspaceService(
      this.workspaceRepository,
    );
    this.deleteWorkspaceService = new DeleteWorkspaceService(
      this.workspaceRepository,
    );
    this.searchWorkspaceService = new SearchWorkspaceService(
      this.workspaceRepository,
    );
    this.favoriteWorkspaceService = new FavoriteWorkspaceService(
      this.workspaceRepository,
    );
    this.colorService = new ColorService(this.workspaceRepository);
    this.editNameWorkspaceService = new EditNameWorkspaceService(
      this.workspaceRepository,
    );
    this.changeEmojiWorkspaceService = new ChangeEmojiWorkspaceService(
      this.workspaceRepository,
      context.extensionUri,
    );
    this.changeColorWorkspaceService = new ChangeColorWorkspaceService(
      this.workspaceRepository,
      this.colorService,
    );
    this.quickPickService = new QuickPickService(
      this.workspaceRepository,
      this.openWorkspaceService,
    );
    this.notificationCreateWorkspaceService =
      new NotificationCreateWorkspaceService(
        this.workspaceRepository,
        this.saveWorkspaceService,
      );
    this.statusBarService = new StatusBarService(this.workspaceRepository);
    this.openConfigFileService = new OpenConfigFileService(
      this.workspaceRepository,
    );
  }
}
