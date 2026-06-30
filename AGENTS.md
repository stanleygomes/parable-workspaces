## Project Overview

**Parable Workspaces** is a VS Code extension for managing projects and workspaces. It provides a sidebar view to save, organize, and switch between projects instantly, with support for cloud synchronization and visual identification.

### Technology Stack

- **Language**: TypeScript
- **Build Tool**: npm
- **Platform**: VS Code
- **Code Quality**: ESLint, Prettier

### Project Structure

```
src/
├── extension.ts               # Main entry point to activate VS Code extension
├── container.ts               # Dependency injection container wiring services and adapters
├── commands.ts                # VS Code command registrations mapping to services
├── core/                      # Pure domain/business logic and data structures
│   ├── dtos/                  # Data structures (Workspace structure, WebviewMessage)
│   ├── enums/                 # Application enums (Emojis, SettingsKey, SortType, WorkspaceColor)
│   ├── helpers/               # Utilities (DateHelper, FileHelper, StringHelper, TemplateHelper)
│   ├── repositories/          # Domain repository managing workspace persistence
│   └── services/              # Domain services implementing single business cases (Save, Open, Delete, Sort)
└── infra/                     # Infrastructure implementations & VS Code integration adapters
    ├── editor/                # Adapters for VS Code UI interactions (status bar, themes, confirmation dialogs)
    ├── persistence/           # State persistence, backing up globalState to workspaces.json
    └── view/                  # Sidebar Webview module
        ├── css/               # Webview stylesheets (main.css)
        ├── html/              # HTML layout segments (toolbar, filters, workspaces list)
        ├── js/                # Modular frontend JS files (controller, renderer, contextMenu, utils)
        ├── HtmlTemplateBuilder.ts # Dynamic HTML builder concatenating segments & JS
        ├── ViewMessageHandler.ts  # Webview message router bridging UI to domain services
        ├── ViewProvider.ts    # Webview provider resolving side bar panels
        └── ViewState.ts       # Cache of current filters/sorting and generator of webview data payloads
```

### Folder Responsibilities

- **`core/dtos`**: Defines schemas and typed interfaces for communication and storage.
- **`core/enums`**: Project-wide lookup constants and sorting modes.
- **`core/helpers`**: Domain helpers for string manipulation, relative dates, and template replacement.
- **`core/repositories`**: Bridge between services and state management storage.
- **`core/services`**: House all business rules, ensuring controllers/view handler don't contain domain logic.
- **`infra/editor`**: VS Code host window adapters for dialogs, status bar, and editor colors.
- **`infra/persistence`**: Low-level JSON file writing and OS configurations.
- **`infra/view`**: Decoupled UI layer comprising raw template assets, modular webview scripts, and the state compiler (`ViewState`).

### VS Code Extension Architecture

### Development Workflow

1. Make code changes following the coding rules
2. Run `npm run format` to ensure code style
3. Run `npm run lint` to validate code style
4. Run `npm run package` to build the extension
5. Test in Extension Development Host

## Code Rules

### Clean Code

- Write extremely concise and objective code
- Never put comments in the code - prefer clear names and method/class extraction

### SOLID Principles

- Total priority for Single Responsibility (SRP) and Open/Closed (OCP)
- Separate responsibilities into reusable classes

### Project-Specific Rules

**Internationalization**:

- Use VS Code's localization API for strings
- Store localized strings in `package.nls.json` or locale-specific files

**Language**:

- Code must be written in English
- All text strings must be in English (localized via i18n)

**Package Structure**:

- Follow the existing structure under `src/`
- Persistence layer in `repository/`
- Business logic in `service/`
- UI components in `ui/`
- Utilities in `helper/`

**VS Code APIs**:

- Use VS Code extension APIs correctly
- Register commands, views, and configurations in `package.json`
- Follow VS Code extension best practices
- Use workspace and global state appropriately
