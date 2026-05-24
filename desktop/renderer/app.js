'use strict';

const pet = document.getElementById('pet');
const bubble = document.getElementById('bubble');
const message = document.getElementById('message');

let hideTimer = null;
let lastMessage = '';
let dragState = null;

function setState(state, force = false) {
  const nextMessage = state && state.message ? state.message : 'Boba 正在待命。';
  const mood = state && state.mood ? state.mood : 'idle';

  pet.className = `pet mood-${mood}`;
  message.textContent = nextMessage;

  if (force || nextMessage !== lastMessage) {
    showBubble();
  }

  lastMessage = nextMessage;
}

function showBubble() {
  bubble.classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    bubble.classList.add('hidden');
  }, 5000);
}

async function refreshState(force = false) {
  const state = await window.bobaDesktop.getState();
  setState(state, force);
}

window.bobaDesktop.onState((state) => {
  setState(state, Boolean(state && state.force));
});

pet.addEventListener('dblclick', () => {
  refreshState(true);
});

pet.addEventListener('pointerdown', async (event) => {
  if (event.button !== 0) return;
  const [windowX, windowY] = await window.bobaDesktop.getWindowPosition();
  dragState = {
    pointerId: event.pointerId,
    startScreenX: event.screenX,
    startScreenY: event.screenY,
    windowX,
    windowY,
    moved: false
  };
  pet.classList.add('dragging');
  pet.setPointerCapture(event.pointerId);
});

pet.addEventListener('pointermove', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  const dx = event.screenX - dragState.startScreenX;
  const dy = event.screenY - dragState.startScreenY;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    dragState.moved = true;
  }
  window.bobaDesktop.setWindowPosition({
    x: dragState.windowX + dx,
    y: dragState.windowY + dy
  });
});

pet.addEventListener('pointerup', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  pet.releasePointerCapture(event.pointerId);
  pet.classList.remove('dragging');
  window.bobaDesktop.savePosition();
  dragState = null;
});

pet.addEventListener('pointercancel', () => {
  pet.classList.remove('dragging');
  dragState = null;
});

pet.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  window.bobaDesktop.showMenu();
});

window.addEventListener('beforeunload', () => {
  window.bobaDesktop.savePosition();
});

refreshState(true);
setInterval(() => refreshState(false), 2000);
