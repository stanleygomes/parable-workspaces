import * as fs from 'fs';
import * as path from 'path';

export class FileHelper {
  public static buildPath(base: string, ...parts: string[]): string {
    return path.join(base, ...parts);
  }

  public static readText(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf8');
  }
}
