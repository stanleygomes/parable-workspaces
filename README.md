![Build](https://github.com/stanleygomes/parable-workspaces/workflows/Build/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/stanleygomes/parable-workspaces.svg?style=flat&logo=github)](https://github.com/stanleygomes/parable-workspaces/network)
[![GitHub issues](https://img.shields.io/github/issues/stanleygomes/parable-workspaces.svg?style=flat&logo=github)](https://github.com/stanleygomes/parable-workspaces/issues)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

# Parable Workspaces

![screenshot](https://github.com/stanleygomes/parable-workspaces/raw/HEAD/resources/screenshot.png)

<!-- Plugin description -->

**Parable Workspaces** is the best way to manage your vscode, cursor and antigravity workspaces. Switch between projects instantly, keep your workspaces organized, and sync your favorite projects across all your devices.

- **Instant Project Switching**: Quickly jump between saved workspaces without losing your flow.
- **Visual Identification**: Assign colors and icons to your workspaces for instant recognition in the Activity Bar.
- **Quick Access**: Search and open projects directly from the command palette (`Ctrl+P`).
- **Automatic Detection**: Get notified to save new folders as workspaces as soon as you open them.
- **Peacock Integration**: Customize the editor's color scheme per workspace to never lose track of where you are.
<!-- Plugin description end -->

## 🌐 Plugin Marketplace Links

| Platform             | Link                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| VS Code              | [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=StanleyGomes.parable-workspaces) |
| Antigravity / Cursor | [Open VSX Registry](https://open-vsx.org/extension/stanleygomes/parable-workspaces)                              |

## 📋 Table of Contents

- [Usage](#-usage)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Configuration](#-configuration)
- [Development](#-development)
  - [Requirements](#requirements)
  - [Building from source](#building-from-source)
  - [Running tests](#running-tests)
  - [Running code inspections](#running-code-inspections)
- [CI/CD](#-cicd)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Usage

### Opening the Tool Window

- Click on the **Parable Workspaces** icon in the left sidebar of your editor;
- Use the `List Saved Projects` command from the Command Palette.

## ⌨️ Keyboard Shortcuts

Waiting for implementation...

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

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm install`          | Installs dependencies                          |
| `npm run build`        | Compiles the extension                         |
| `npm run lint`         | Runs ESLint checks                             |
| `npm run test`         | Runs extension tests                           |
| `npm run package`      | Packages the extension for distribution        |
| `npm run publish`      | Publishes the extension to VS Code Marketplace |
| `npm run ovsx:publish` | Publishes to OpenVSX Registry                  |

Coverage reports are generated in `coverage/` and use the `nyc` tool.

## 🚀 CI/CD

This project uses GitHub Actions for continuous integration and deployment. The following workflows are configured:

### Build Workflow (`build.yml`)

- **Trigger**: Push to `master` branch or pull requests
- **Actions**:
  - Validates conventional commits
  - Builds and validates the VS Code extension (lint, test, package)

### Release Workflow (`release.yml`)

- **Trigger**: Manual dispatch (`workflow_dispatch`)
- **Version auto-detection**: The workflow reads commits since the last `v*` tag and applies semantic versioning rules (breaking change → major, `feat:` → minor, everything else → patch).
- **Jobs**:
  1. `prepare_release` — auto-calculates versions, bumps files, updates changelogs, opens a PR targeting `master`, and creates the `v<version>` tag
  2. `publish_vscode` _(conditional)_ — packages and publishes to Visual Studio Marketplace and OpenVSX
  3. `create_release` _(conditional)_ — creates separate GitHub Releases per plugin and attaches built artifacts

### Deploy Landpage Workflow (`deploy-landpage.yml`)

- **Trigger**: Push to `master` affecting `landpage/**`, or manual dispatch
- **Actions**:
  - Builds and deploys the landing page to Vercel

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

---

Made with 🔥 by Lumen HQ

```

```
