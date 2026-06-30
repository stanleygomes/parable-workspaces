class WorkspacesViewController {
  constructor() {
    this.vscode = acquireVsCodeApi();
    this.showOnlyFavorites = false;
    this.currentSort = 'favorites';
    this.showFilters = false;

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
    renderWorkspaces(this.vscode, this.workspacesList, message.workspaces);
    renderBanner(this.vscode, message.currentStatus, message.workspaces);
  }
}

new WorkspacesViewController();
