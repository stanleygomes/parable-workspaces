import { OpenConfigFileService } from '../../service/OpenConfigFileService';

export function createOpenConfigFile(
  openConfigFileService: OpenConfigFileService,
) {
  return async () => {
    await openConfigFileService.open();
  };
}
