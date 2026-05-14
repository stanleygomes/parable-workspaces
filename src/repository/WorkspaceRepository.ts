import * as vscode from 'vscode';
import { Project } from '../type/Project';

export class WorkspaceRepository {
  private static readonly STORAGE_KEY = 'savedProjects';

  constructor(private readonly context: vscode.ExtensionContext) {
    // Enable cloud sync for this key, so projects follow the user
    if (context.globalState.setKeysForSync) {
      context.globalState.setKeysForSync([WorkspaceRepository.STORAGE_KEY]);
    }
  }

  getAll(): Project[] {
    return this.context.globalState.get<Project[]>(WorkspaceRepository.STORAGE_KEY, []);
  }

  async save(project: Project): Promise<void> {
    const projects = this.getAll();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    await this.context.globalState.update(WorkspaceRepository.STORAGE_KEY, projects);
  }

  async delete(projectId: string): Promise<void> {
    const projects = this.getAll().filter((p) => p.id !== projectId);
    await this.context.globalState.update(
      WorkspaceRepository.STORAGE_KEY,
      projects,
    );
  }

  async updateLastOpened(projectId: string): Promise<void> {
    const projects = this.getAll();
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      project.lastOpened = Date.now();
      await this.context.globalState.update(
        WorkspaceRepository.STORAGE_KEY,
        projects,
      );
    }
  }
}
