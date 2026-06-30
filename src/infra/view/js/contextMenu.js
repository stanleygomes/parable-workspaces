function showContextMenu(vscode, x, y, workspaceId, isFavorite) {
  const contextMenu = document.getElementById('contextMenu');
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
      vscode.postMessage({ command: item.getAttribute('data-action'), workspaceId });
      contextMenu.style.display = 'none';
    });
  });
}
