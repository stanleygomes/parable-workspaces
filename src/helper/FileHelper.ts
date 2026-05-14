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

  public static writeText(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }

  public static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  public static mkdir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

