# Change Log

All notable changes to the "parable-workspaces" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [1.4.0] - 2026-05-17

- docs: update README with new quick access shortcut, workspace creation commands, and keyboard shortcut table
- feat: replace quick access with global keyboard shortcut and dedicated command for workspace switching
- chore: change extension screenshot
- Merge pull request #9 from stanleygomes/release/v1.3.0


## [1.3.0] - 2026-05-14

- docs: update README with OpenVSX link and replace fire emoji with heart
- docs: add Azure Dev link and remove redundant markdown code blocks in README
- docs: update project description and add emoji to README title
- chore: update project description in package.json
- docs: update extension description in package.json
- chore: bump version to 1.2.0
- chore: update ignore patterns and add build and packaging scripts to package.json
- fix: resolve favicon path by accessing .src property in root layout
- feat: implement customizable workspace text colors and add visual color badges to UI
- feat: implement workspace coloring functionality and decouple workspace edit services
- docs: update product description and metadata to reflect rebranding to Parable Workspaces
- feat: rebrand project to Parable Workspaces, update assets, and replace logo with PNG format
- feat: implement QuickPickService to enable workspace selection via command palette
- feat: add workspace sorting functionality with persistent settings support
- feat: add workspace emoji customization and status bar display
- feat: add SettingsService and persist favorites filter state in global storage
- feat: add favorites filter toggle to workspace view
- feat: add support for favoriting workspaces with UI toggles and priority sorting
- refactor: remove icon and clear name for workspace manager view in package.json
- feat: add banner to prompt saving unsaved workspaces in the UI
- feat: add refresh workspaces command to workspace view menu
- refactor: decompose monolithic WorkspaceService into granular, single-responsibility domain services
- refactor: abstract filesystem operations into FileHelper and update WorkspaceRepository to use it
- feat: add workspace change event emitter and auto-refresh for UI provider with activation on startup
- feat: add NotificationService to prompt saving workspaces and localize UI strings to English
- refactor: remove redundant whitespace in package.json and workspace path display in index.html
- chore: remove sql.js dependency and associated build scripts and type definitions
- refactor: rename codex notes view container and components to workspace manager and remove unused settings class
- refactor: replace workspace backup and sync UI with a list-based export interface
- refactor: remove legacy note management services and repositories in favor of workspace-based architecture
- refactor: migrate project entity to multi-folder workspace model and update repository storage logic
- feat: rebrand project to Parable Workspaces and add workspace management service and repository with cloud sync support
- feat: implement QuickSearchService to enable note searching via command and quick access prefix
- feat: replace date filter chips with a dropdown and update filter layout styling
- feat: migrate import/export functionality to a dedicated Backup & Sync webview panel
- fix: correct path to WebviewMessage type definition
- refactor: encapsulate note serialization logic into a dedicated NoteMapper and extract WebviewMessage interface
- chore: configure Prettier and enforce code style across the repository
- feat: implement webview templating system and update Notes explorer UI
- style: move context menu display property to CSS and clean up select styling
- feat: add primary button to empty notes state to trigger note creation
- refactor: streamline build configuration, update dependencies, and clean up UI elements
- docs: remove installation section from README table of contents
- chore: update tsconfig.json to include source files and exclude unnecessary directories
- chore: rename output package to codex-notes and add compilation step to CI workflows
- feat: redesign landing page with terminal-inspired aesthetic and command-based installation UI
- docs: update screenshot image source path in README
- refactor: removed jebrains plugin code
- chore: link cursor
- docs: update attribution from NazarethLabs to Lumen HQ


## [1.0.0] - 2026-05-13

### Added
- Initial migration from Codex Notes to **Parable Workspaces**.
- Incremental migration infrastructure (Hybrid SQLite/JSON support).
- New `WorkspaceRepository` using VS Code `globalState` for automatic Cloud Sync.
- Commands to save the current folder as a project and list saved projects.
- Full project rebranding (README, Roadmap, CLAUDE.md).
