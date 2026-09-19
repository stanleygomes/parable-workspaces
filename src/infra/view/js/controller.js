class WorkspacesViewController {
  constructor() {
    this.vscode = acquireVsCodeApi();
    this.showOnlyFavorites = false;
    this.currentSort = 'favorites';
    this.showFilters = false;
    this.showTimeUpdated = false;

    this.searchBox = document.getElementById('searchBox');
    this.btnToggleFilters = document.getElementById('btnToggleFilters');
    this.btnShowFavorites = document.getElementById('btnShowFavorites');
    this.btnShowTimeUpdated = document.getElementById('btnShowTimeUpdated');
    this.sortSelect = document.getElementById('sortSelect');
    this.workspacesList = document.getElementById('workspacesList');
    this.contextMenu = document.getElementById('contextMenu');
    this.filterRow = document.querySelector('.filter-row');

    this.bindEvents();
    this.observeFilterRowWidth();
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

    this.btnShowTimeUpdated.addEventListener('click', () => {
      this.showTimeUpdated = !this.showTimeUpdated;
      this.btnShowTimeUpdated.classList.toggle('active', this.showTimeUpdated);
      this.vscode.postMessage({
        command: 'toggleTimeUpdated',
        showTimeUpdated: this.showTimeUpdated,
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

    window.addEventListener('resize', () => {
      this.updateFilterCompactMode();
    });
  }

  observeFilterRowWidth() {
    if (typeof ResizeObserver === 'undefined') {
      this.updateFilterCompactMode();
      return;
    }

    this.filterResizeObserver = new ResizeObserver(() => {
      this.updateFilterCompactMode();
    });
    this.filterResizeObserver.observe(this.filterRow);
    this.updateFilterCompactMode();
  }

  updateFilterCompactMode() {
    if (this.filterRow.classList.contains('hidden')) {
      return;
    }

    this.filterRow.classList.remove('compact');
    this.sortSelect.style.flex = '0 0 auto';
    const overflows =
      this.filterRow.scrollWidth > this.filterRow.clientWidth + 1;
    this.sortSelect.style.flex = '';
    this.filterRow.classList.toggle('compact', overflows);
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
      this.showTimeUpdated = !!message.filters.showTimeUpdated;
      this.btnShowTimeUpdated.classList.toggle('active', this.showTimeUpdated);
      requestAnimationFrame(() => this.updateFilterCompactMode());
    }
    renderWorkspaces(
      this.vscode,
      this.workspacesList,
      message.workspaces || [],
      message.filters,
    );
    renderBanner(this.vscode, message.currentStatus, message.workspaces || []);
  }
}

new WorkspacesViewController();
