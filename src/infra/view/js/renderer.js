function renderWorkspaces(vscode, workspacesList, workspaces) {
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

  workspacesList.innerHTML = workspaces
    .map(
      (ws) => `
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
              ? `<div class="workspace-tags">
                  ${ws.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>`
              : ''
          }
        </div>
      </div>
    `,
    )
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
      const wrapper = item.querySelector('.workspace-emoji-wrapper');
      if (wrapper) {
        wrapper.style.setProperty(
          '--workspace-color',
          ws.color || 'var(--vscode-foreground)',
        );
      }
    }

    item.addEventListener('click', () => {
      vscode.postMessage({
        command: 'openWorkspace',
        workspaceId: item.dataset.id,
      });
    });

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(
        vscode,
        e.clientX,
        e.clientY,
        item.dataset.id,
        ws?.isFavorite,
      );
    });
  });
}

function renderBanner(vscode, status, workspaces) {
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
