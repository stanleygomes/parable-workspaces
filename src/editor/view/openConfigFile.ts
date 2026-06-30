import { OpenWorkspacesFileService } from '../../service/OpenWorkspacesFileService';

export function createOpenConfigFile(
  OpenWorkspacesFileService: OpenWorkspacesFileService,
) {
  return async () => {
    await OpenWorkspacesFileService.open();
  };
}
