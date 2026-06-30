const vscode = acquireVsCodeApi();
let currentWorkspaceId = null;
let showOnlyFavorites = false;
let currentSort = 'favorites';
let showFilters = false;

const searchBox = document.getElementById('searchBox');
const btnToggleFilters = document.getElementById('btnToggleFilters');
const btnShowFavorites = document.getElementById('btnShowFavorites');
const sortSelect = document.getElementById('sortSelect');
const workspacesList = document.getElementById('workspacesList');
const contextMenu = document.getElementById('contextMenu');
const filterRow = document.querySelector('.filter-row');
let availableColors = [];

searchBox.addEventListener('input', () => {
  vscode.postMessage({ command: 'search', query: searchBox.value });
});

btnShowFavorites.addEventListener('click', () => {
  showOnlyFavorites = !showOnlyFavorites;
  btnShowFavorites.classList.toggle('active', showOnlyFavorites);
  vscode.postMessage({
    command: 'toggleFavoritesFilter',
    showOnlyFavorites,
  });
});

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  vscode.postMessage({ command: 'changeSort', sortType: currentSort });
});

btnToggleFilters.addEventListener('click', () => {
  showFilters = !showFilters;
  vscode.postMessage({ command: 'toggleFilters', showFilters });
});

document.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) {
    contextMenu.style.display = 'none';
  }
});

function renderWorkspaces(workspaces) {
  if (workspaces.length === 0) {
    workspacesList.innerHTML = `
    <div class="empty-state">
      <p>No workspaces saved yet.</p>
      <button class="primary-btn" id="btnSaveCurrent">Save Current Workspace</button>
    </div>
  `;
    document.getElementById('btnSaveCurrent').addEventListener('click', () => {
      vscode.postMessage({ command: 'saveCurrent' });
    });
    return;
  }

  function getInitials(name) {
    if (!name) {
      return 'WS';
    }
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  workspacesList.innerHTML = workspaces
    .map((ws) => {
      return `
    <div class="workspace-item design-emoji-ring" data-id="${ws.id}">
      <div class="workspace-emoji-wrapper">
        ${
          ws.emoji
            ? `<span class="workspace-emoji">${ws.emoji}</span>`
            : `<span class="workspace-initials">${getInitials(ws.name)}</span>`
        }
      </div>
      <div class="workspace-body">
        <div class="workspace-header">
          <span class="workspace-title">
            ${escapeHtml(ws.name)}
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
            ${ws.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
    })
    .join('');

  workspacesList.querySelectorAll('.star-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({
        command: 'toggleFavorite',
        workspaceId: btn.dataset.id,
      });
    });
  });

  workspacesList.querySelectorAll('.workspace-item').forEach((item) => {
    const ws = workspaces.find((w) => w.id === item.dataset.id);
    if (ws) {
      const color = ws.color || 'var(--vscode-foreground)';
      const wrapper = item.querySelector('.workspace-emoji-wrapper');
      if (wrapper) {
        wrapper.style.setProperty('--workspace-color', color);
      }
    }

    item.addEventListener('click', (e) => {
      vscode.postMessage({
        command: 'openWorkspace',
        workspaceId: item.dataset.id,
      });
    });
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, item.dataset.id, ws?.isFavorite);
    });
  });
}

function getColorEmoji(hex) {
  const color = availableColors.find((c) => c.color === hex);
  return color ? color.label : '⚪';
}

function showContextMenu(x, y, workspaceId, isFavorite) {
  currentWorkspaceId = workspaceId;
  contextMenu.innerHTML = `
  <div class="context-menu-item" data-action="openWorkspace">Open Workspace</div>
  <div class="context-menu-item" data-action="openWorkspaceNewWindow">Open in New Window</div>
  <div class="context-menu-item" data-action="toggleFavorite">${isFavorite ? 'Unfavorite' : 'Favorite'}</div>
  <div class="context-menu-item" data-action="changeEmoji">Change Emoji</div>
  <div class="context-menu-item" data-action="changeColor">Change Color</div>
  <div class="context-menu-separator"></div>
  <div class="context-menu-item" data-action="editWorkspace">Rename</div>
  <div class="context-menu-item" data-action="deleteWorkspace">Delete</div>
`;
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.style.display = 'block';

  contextMenu.querySelectorAll('.context-menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      vscode.postMessage({
        command: action,
        workspaceId: currentWorkspaceId,
      });
      contextMenu.style.display = 'none';
    });
  });
}

function escapeHtml(str) {
  if (!str) {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.command === 'updateWorkspaces') {
    if (message.filters) {
      showOnlyFavorites = message.filters.showOnlyFavorites;
      btnShowFavorites.classList.toggle('active', showOnlyFavorites);
      currentSort = message.filters.sortType;
      sortSelect.value = currentSort;

      showFilters = !!message.filters.showFilters;
      btnToggleFilters.classList.toggle('active', showFilters);
      filterRow.classList.toggle('hidden', !showFilters);
    }
    if (message.availableColors) {
      availableColors = message.availableColors;
    }
    renderWorkspaces(message.workspaces);
    renderBanner(message.currentStatus, message.workspaces);
  }
});

function renderBanner(status, workspaces) {
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
      <button class="primary-btn featured-btn" id="btnSaveBanner">Save "${escapeHtml(status.name)}"</button>
    </div>
  `;

  document.getElementById('btnSaveBanner').addEventListener('click', () => {
    vscode.postMessage({ command: 'saveCurrent' });
  });
}
