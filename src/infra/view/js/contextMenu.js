function calculateMenuCoordinate(
  cursorPos,
  menuSize,
  viewportSize,
  padding = 4,
) {
  if (cursorPos + menuSize <= viewportSize - padding) {
    return Math.max(padding, cursorPos);
  }

  const flippedPos = cursorPos - menuSize;
  if (flippedPos >= padding) {
    return flippedPos;
  }

  return Math.max(padding, viewportSize - menuSize - padding);
}

function positionContextMenu(contextMenu, x, y) {
  const left = calculateMenuCoordinate(
    x,
    contextMenu.offsetWidth,
    window.innerWidth,
  );
  const top = calculateMenuCoordinate(
    y,
    contextMenu.offsetHeight,
    window.innerHeight,
  );

  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
}

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
  contextMenu.style.visibility = 'hidden';
  contextMenu.style.display = 'block';
  positionContextMenu(contextMenu, x, y);
  contextMenu.style.visibility = 'visible';

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
