function clampContextMenuPosition(
  x,
  y,
  menuWidth,
  menuHeight,
  viewportWidth,
  viewportHeight,
  padding,
) {
  const edge = padding ?? 4;
  let left = x;
  let top = y;

  if (left + menuWidth > viewportWidth - edge) {
    left = Math.max(edge, viewportWidth - menuWidth - edge);
  }
  if (top + menuHeight > viewportHeight - edge) {
    top = Math.max(edge, viewportHeight - menuHeight - edge);
  }
  if (left < edge) {
    left = edge;
  }
  if (top < edge) {
    top = edge;
  }

  return { left, top };
}

function showContextMenu(vscode, x, y, workspaceId, isFavorite) {
  const contextMenu = document.getElementById('contextMenu');
  contextMenu.innerHTML = `
    <div class="context-menu-item" data-action="openWorkspace">Open Workspace</div>
    <div class="context-menu-item" data-action="openWorkspaceNewWindow">Open in New Window</div>
    <div class="context-menu-item" data-action="toggleFavorite">${isFavorite ? 'Unfavorite' : 'Favorite'}</div>
    <div class="context-menu-item" data-action="changeEmoji">Change Emoji</div>
    <div class="context-menu-item" data-action="changeIcon">Change Icon</div>
    <div class="context-menu-item" data-action="changeColor">Change Color</div>
    <div class="context-menu-separator"></div>
    <div class="context-menu-item" data-action="editWorkspace">Rename</div>
    <div class="context-menu-item" data-action="deleteWorkspace">Delete</div>
  `;
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.style.display = 'block';

  const rect = contextMenu.getBoundingClientRect();
  const clamped = clampContextMenuPosition(
    x,
    y,
    rect.width,
    rect.height,
    window.innerWidth,
    window.innerHeight,
  );
  contextMenu.style.left = clamped.left + 'px';
  contextMenu.style.top = clamped.top + 'px';

  contextMenu.querySelectorAll('.context-menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      vscode.postMessage({
        command: item.getAttribute('data-action'),
        workspaceId,
      });
      contextMenu.style.display = 'none';
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clampContextMenuPosition, showContextMenu };
}
