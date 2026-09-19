![Build](https://github.com/stanleygomes/parable-workspaces/workflows/Build/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/stanleygomes/parable-workspaces.svg?style=flat&logo=github)](https://github.com/stanleygomes/parable-workspaces/network)
[![GitHub issues](https://img.shields.io/github/issues/stanleygomes/parable-workspaces.svg?style=flat&logo=github)](https://github.com/stanleygomes/parable-workspaces/issues)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

# 🗃️ Parable Workspaces

![screenshot](https://github.com/stanleygomes/parable-workspaces/raw/HEAD/resources/screenshot.png)

<!-- Plugin description -->

**Parable Workspaces** is the elegant and efficient workspace manager for your projects in vscode, cursor and antigravity.

- **Instant Project Switching**: Quickly jump between saved workspaces without losing your flow.
- **Visual Identification**: Assign colors and icons to your workspaces for instant recognition in the Activity Bar.
- **Quick Access**: Open and switch workspaces instantly from the top of the editor with a single keyboard shortcut or via the Command Palette (`Alt + P`).
- **Automatic Detection**: Get notified to save new folders as workspaces as soon as you open them.
- **Peacock Integration**: Customize the editor's color scheme per workspace to never lose track of where you are.
<!-- Plugin description end -->

## 🌐 Install & Marketplace Links

| Platform               | Marketplace Link                                                                                           | Quick Install Command                                             |
| :--------------------- | :--------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Visual Studio Code** | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=StanleyGomes.parable-workspaces) | `code --install-extension StanleyGomes.parable-workspaces`        |
| **Cursor**             | [Open VSX Registry](https://open-vsx.org/extension/stanleygomes/parable-workspaces)                        | `cursor --install-extension StanleyGomes.parable-workspaces`      |
| **Antigravity**        | [Open VSX Registry](https://open-vsx.org/extension/stanleygomes/parable-workspaces)                        | `antigravity --install-extension StanleyGomes.parable-workspaces` |

## 📋 Table of Contents

- [Usage](#-usage)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Configuration](#-configuration)
- [Development](#-development)
  - [Requirements](#requirements)
  - [Building from source](#building-from-source)
  - [Running code inspections](#running-code-inspections)
- [CI/CD](#-cicd)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Usage

### Opening the Tool Window

- **Activity Bar**: Click on the **Parable Workspaces** icon in the left sidebar of your editor;
- **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and select the command `Parable: List/Open Workspaces`;
- **Keyboard Shortcut**: Press `Alt + P` (or `Cmd + Option + P` on Mac) to open the switcher dropdown at the top of your editor.

### Creating a New Workspace

You can save and register a new workspace in **Parable Workspaces** in two ways:

1. **Sidebar Button**: Click the `+` (plus) icon at the top of the **Parable Workspaces** sidebar panel.
2. **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and run the `Parable: Save Current Workspace` command.

> [!TIP]
> **Automatic Detection**: When you open a new folder in VS Code that is not yet mapped, Parable Workspaces will automatically trigger a popup notification in the bottom right corner of the editor, asking if you would like to save/register this new workspace. This keeps your workspace list updated effortlessly!

## ⌨️ Keyboard Shortcuts

| Shortcut           | OS              | Description                                           |
| ------------------ | --------------- | ----------------------------------------------------- |
| `Alt + P`          | Linux / Windows | Opens the workspace switcher at the top of the screen |
| `Cmd + Option + P` | macOS           | Opens the workspace switcher at the top of the screen |

## 🛠️ Development

**Requirements**

```
- Node.js 22.x+
- VS Code 1.85.0+
```

**Running and Debugging**

1.  Open the project in Visual Studio Code.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Press `F5` to start a new VS Code instance with the extension enabled.
4.  To debug the **Webview**:
    - Open the Parable Workspaces view.
    - Run the command: `Developer: Open Webview Developer Tools` from the Command Palette.
5.  To debug the **Extension Host**:
    - Check the `Debug Console` in the main VS Code window for logs and errors.
    - Set breakpoints directly in the TypeScript files.

**Available Commands**

| Command                      | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| `npm install`                | Installs dependencies                                         |
| `npm run build`              | Compiles the extension                                        |
| `npm run lint`               | Runs ESLint checks                                            |
| `npm run test`               | Runs unit tests then e2e tests                                |
| `npm run test:unit`          | Runs Vitest unit tests                                        |
| `npm run test:unit:coverage` | Runs unit tests and writes `coverage/unit` (brief folder summary) |
| `npm run test:e2e`           | Compiles and runs Mocha e2e tests in a VS Code Extension Host |
| `npm run test:e2e:coverage`  | Runs e2e tests and writes `coverage/e2e` (brief folder summary) |
| `npm run test:coverage`      | Runs unit coverage then e2e coverage (separate report folders) |
| `npm run coverage:summary`   | Prints folder % summaries for existing coverage reports |
| `npm run package`            | Packages the extension for distribution                       |
| `npm run publish`            | Publishes the extension to VS Code Marketplace                |
| `npm run ovsx:publish`       | Publishes to OpenVSX Registry                                 |

### Testing

- **Unit tests** use **Vitest** (fast Node runner, no VS Code process). Co-locate them next to the code under test as `*.test.ts` (for example `src/core/helpers/StringHelper.test.ts`).
- **E2E / integration tests** use **`@vscode/test-cli`** + **Mocha** (official Extension Development Host runner). Place them in `src/test/e2e/**/*.test.ts`.
- Coverage is **separate by design**:
  - `coverage/unit/` — Vitest V8 coverage (primary, actionable metric). Open `coverage/unit/index.html`.
  - `coverage/e2e/` — `@vscode/test-cli --coverage` via Extension Host `NODE_V8_COVERAGE`. Open `coverage/e2e/index.html`.
- CLI coverage output is a short **path %** table. Root entry files are listed individually (`src/extension.ts`, …), not rolled into a misleading `src` bucket. E2E summary leads with **function** coverage because line % is inflated by activation/module load. Re-print anytime with `npm run coverage:summary`.
- Treat e2e coverage as a coarse Extension Host report: activation loads much of the DI graph, so percentages look higher than unit coverage and are not a path-coverage substitute.
- CI uploads both artifacts. There is no coverage threshold gate. E2e output is filtered for known Extension Host noise (AgentHost session spam, clean exit `signal: unknown`).
- Placeholder dirs `coverage/unit` and `coverage/e2e` are tracked; generated HTML/LCOV files stay gitignored.

## 🚀 CI/CD

This project uses GitHub Actions for continuous integration and deployment. The following workflows are configured:

### Build Workflow (`build.yml`)

- **Trigger**: Push to `master` branch or pull requests
- **Actions**:
  - Validates conventional commits
  - Lints and checks formatting
  - Runs Vitest unit tests and VS Code Mocha e2e tests, uploading separate `coverage/unit` and `coverage/e2e` artifacts
  - Builds and packages the VS Code extension

### Release Workflow (`release.yml`)

- **Trigger**: Manual dispatch (`workflow_dispatch`)
- **Version auto-detection**: The workflow reads commits since the last `v*` tag and applies semantic versioning rules (breaking change → major, `feat:` → minor, everything else → patch).
- **Jobs**:
  1. `prepare_release` — auto-calculates versions, bumps files, updates changelogs, opens a PR targeting `master`, and creates the `v<version>` tag
  2. `publish_vscode` _(conditional)_ — packages and publishes to Visual Studio Marketplace and OpenVSX
  3. `create_release` _(conditional)_ — creates separate GitHub Releases per plugin and attaches built artifacts

## 📦 How to Release

1. Go to **Actions → Release** in the GitHub repository.
2. Click **Run workflow**.
3. The workflow will automatically:
   - Detect the new version from commits since the last release tag using semantic versioning.
   - Bump versions in `package.json`.
   - Update the `CHANGELOG.md` with commit entries.
   - Open a release PR with the generated changes targeting `master`.
   - Create the `v<version>` git tag.
   - Publish to the selected marketplaces.
   - Create separate GitHub Releases per plugin with built artifacts.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Issue Tracker](https://github.com/stanleygomes/parable-workspaces/issues)
- [AZURE Dev](https://dev.azure.com/stanleygomesdasilva)
- [OpenVSX Publisher](https://open-vsx.org/user-settings/profile)
