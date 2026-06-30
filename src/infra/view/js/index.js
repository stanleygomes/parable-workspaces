class WorkspacesViewController {
  constructor() {
    this.vscode = acquireVsCodeApi();
    this.currentWorkspaceId = null;
    this.showOnlyFavorites = false;
    this.currentSort = 'favorites';
    this.showFilters = false;
    this.availableColors = [];

    this.searchBox = document.getElementById('searchBox');
    this.btnToggleFilters = document.getElementById('btnToggleFilters');
    this.btnShowFavorites = document.getElementById('btnShowFavorites');
    this.sortSelect = document.getElementById('sortSelect');
    this.workspacesList = document.getElementById('workspacesList');
    this.contextMenu = document.getElementById('contextMenu');
    this.filterRow = document.querySelector('.filter-row');

    this.bindEvents();
  }

  bindEvents() {
    this.searchBox.addEventListener('input', () => {
      this.vscode.postMessage({
        command: 'search',
        query: this.searchBox.value,
      });
    });

    this.btnShowFavorites.addEventListener('click', () => {
      this.showOnlyFavorites = !this.showOnlyFavorites;
      this.btnShowFavorites.classList.toggle('active', this.showOnlyFavorites);
      this.vscode.postMessage({
        command: 'toggleFavoritesFilter',
        showOnlyFavorites: this.showOnlyFavorites,
      });
    });

    this.sortSelect.addEventListener('change', () => {
      this.currentSort = this.sortSelect.value;
      this.vscode.postMessage({
        command: 'changeSort',
        sortType: this.currentSort,
      });
    });

    this.btnToggleFilters.addEventListener('click', () => {
      this.showFilters = !this.showFilters;
      this.vscode.postMessage({
        command: 'toggleFilters',
        showFilters: this.showFilters,
      });
    });

    document.addEventListener('click', (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this.contextMenu.style.display = 'none';
      }
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.command === 'updateWorkspaces') {
        this.handleUpdateWorkspaces(message);
      }
    });
  }

  handleUpdateWorkspaces(message) {
    if (message.filters) {
      this.showOnlyFavorites = message.filters.showOnlyFavorites;
      this.btnShowFavorites.classList.toggle('active', this.showOnlyFavorites);
      this.currentSort = message.filters.sortType;
      this.sortSelect.value = this.currentSort;

      this.showFilters = !!message.filters.showFilters;
      this.btnToggleFilters.classList.toggle('active', this.showFilters);
      this.filterRow.classList.toggle('hidden', !this.showFilters);
    }
    if (message.availableColors) {
      this.availableColors = message.availableColors;
    }
    this.renderWorkspaces(message.workspaces);
    this.renderBanner(message.currentStatus, message.workspaces);
  }

  getInitials(name) {
    if (!name) {
      return 'WS';
    }
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  escapeHtml(str) {
    if (!str) {
      return '';
    }
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  renderWorkspaces(workspaces) {
    if (workspaces.length === 0) {
      this.workspacesList.innerHTML = `
      <div class="empty-state">
        <p>No workspaces saved yet.</p>
        <button class="primary-btn" id="btnSaveCurrent">Save Current Workspace</button>
      </div>
    `;
      document
        .getElementById('btnSaveCurrent')
        .addEventListener('click', () => {
          this.vscode.postMessage({ command: 'saveCurrent' });
        });
      return;
    }

    this.workspacesList.innerHTML = workspaces
      .map((ws) => {
        return `
      <div class="workspace-item design-emoji-ring" data-id="${ws.id}">
        <div class="workspace-emoji-wrapper">
          ${
            ws.emoji
              ? `<span class="workspace-emoji">${ws.emoji}</span>`
              : `<span class="workspace-initials">${this.getInitials(ws.name)}</span>`
          }
        </div>
        <div class="workspace-body">
          <div class="workspace-header">
            <span class="workspace-title">
              ${this.escapeHtml(ws.name)}
            </span>
            <div class="header-actions">
              <span class="workspace-date">${ws.dateLabel}</span>
              <button class="star-btn ${ws.isFavorite ? 'favorite-active' : ''}" data-id="${ws.id}">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L10.5 5.5L16 6.5L12 10.5L13 16L8 13.5L3 16L4 10.5L0 6.5L5.5 5.5L8 0Z" />
                </svg>
              </button>
            </div>
          </div>

          ${
            ws.tags && ws.tags.length > 0
              ? `
            <div class="workspace-tags">
              ${ws.tags.map((tag) => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
      })
      .join('');

    this.workspacesList.querySelectorAll('.star-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.vscode.postMessage({
          command: 'toggleFavorite',
          workspaceId: btn.dataset.id,
        });
      });
    });

    this.workspacesList.querySelectorAll('.workspace-item').forEach((item) => {
      const ws = workspaces.find((w) => w.id === item.dataset.id);
      if (ws) {
        const color = ws.color || 'var(--vscode-foreground)';
        const wrapper = item.querySelector('.workspace-emoji-wrapper');
        if (wrapper) {
          wrapper.style.setProperty('--workspace-color', color);
        }
      }

      item.addEventListener('click', (e) => {
        this.vscode.postMessage({
          command: 'openWorkspace',
          workspaceId: item.dataset.id,
        });
      });
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(
          e.clientX,
          e.clientY,
          item.dataset.id,
          ws?.isFavorite,
        );
      });
    });
  }

  showContextMenu(x, y, workspaceId, isFavorite) {
    this.currentWorkspaceId = workspaceId;
    this.contextMenu.innerHTML = `
    <div class="context-menu-item" data-action="openWorkspace">Open Workspace</div>
    <div class="context-menu-item" data-action="openWorkspaceNewWindow">Open in New Window</div>
    <div class="context-menu-item" data-action="toggleFavorite">${isFavorite ? 'Unfavorite' : 'Favorite'}</div>
    <div class="context-menu-item" data-action="changeEmoji">Change Emoji</div>
    <div class="context-menu-item" data-action="changeColor">Change Color</div>
    <div class="context-menu-separator"></div>
    <div class="context-menu-item" data-action="editWorkspace">Rename</div>
    <div class="context-menu-item" data-action="deleteWorkspace">Delete</div>
  `;
    this.contextMenu.style.left = x + 'px';
    this.contextMenu.style.top = y + 'px';
    this.contextMenu.style.display = 'block';

    this.contextMenu.querySelectorAll('.context-menu-item').forEach((item) => {
      item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        this.vscode.postMessage({
          command: action,
          workspaceId: this.currentWorkspaceId,
        });
        this.contextMenu.style.display = 'none';
      });
    });
  }

  renderBanner(status, workspaces) {
    const container = document.getElementById('bannerContainer');
    if (
      !status ||
      status.isSaved ||
      !status.name ||
      (workspaces && workspaces.length === 0)
    ) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="save-banner">
        <p class="banner-text">This workspace is not saved yet</p>
        <button class="primary-btn featured-btn" id="btnSaveBanner">Save "${this.escapeHtml(status.name)}"</button>
      </div>
    `;

    document.getElementById('btnSaveBanner').addEventListener('click', () => {
      this.vscode.postMessage({ command: 'saveCurrent' });
    });
  }
}

new WorkspacesViewController();
