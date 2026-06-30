import * as os from 'os';
import * as path from 'path';

export class OSHelper {
  public static getDefaultConfigPath(): string {
    const home = os.homedir();
    let dir: string;
    switch (process.platform) {
      case 'win32':
        dir = path.join(
          process.env.APPDATA || path.join(home, 'AppData', 'Roaming'),
          'parable-workspaces',
        );
        break;
      case 'darwin':
        dir = path.join(
          home,
          'Library',
          'Application Support',
          'parable-workspaces',
        );
        break;
      default:
        dir = path.join(
          process.env.XDG_CONFIG_HOME || path.join(home, '.config'),
          'parable-workspaces',
        );
        break;
    }
    return path.join(dir, 'workspaces.json');
  }
}
