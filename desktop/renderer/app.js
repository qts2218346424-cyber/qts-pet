'use strict';

const pet = document.getElementById('pet');
const bubble = document.getElementById('bubble');
const message = document.getElementById('message');

let hideTimer = null;
let lastMessage = '';
let dragState = null;
let walkDirection = 1;
let walkPausedUntil = 0;
let lastWalkAt = 0;
let canAutoWalk = false;

const IDLE_TEXT = '\u0042\u006f\u0062\u0061 \u6b63\u5728\u5f85\u547d\u3002';
const WALK_SPEED_PX_PER_SECOND = 24;
const WALK_RESUME_DELAY_MS = 2000;

function setState(state, force = false) {
  const nextMessage = state && state.message ? state.message : IDLE_TEXT;
  const mood = state && state.mood ? state.mood : 'idle';

  pet.className = `pet mood-${mood} ${walkDirection < 0 ? 'facing-left' : 'facing-right'}`;
  message.textContent = nextMessage;

  if (force || nextMessage !== lastMessage) {
    showBubble();
  }

  lastMessage = nextMessage;
}

function showBubble() {
  pauseWalking(3500);
  bubble.classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    bubble.classList.add('hidden');
  }, 5000);
}

function pauseWalking(durationMs = WALK_RESUME_DELAY_MS) {
  walkPausedUntil = Math.max(walkPausedUntil, performance.now() + durationMs);
  pet.classList.add('paused');
}

async function refreshState(force = false) {
  const state = await window.bobaDesktop.getState();
  setState(state, force);
}

async function walkFrame(now) {
  if (!lastWalkAt) {
    lastWalkAt = now;
  }

  const deltaSeconds = Math.min((now - lastWalkAt) / 1000, 0.08);
  lastWalkAt = now;

  if (canAutoWalk && !dragState && now >= walkPausedUntil) {
    pet.classList.remove('paused');
    const [windowX, windowY] = await window.bobaDesktop.getWindowPosition();
    const workArea = await window.bobaDesktop.getWorkArea();
    const petWidth = 300;
    const minX = workArea.x + 60;
    const maxX = workArea.x + workArea.width - petWidth - 160;
    let nextX = windowX + walkDirection * WALK_SPEED_PX_PER_SECOND * deltaSeconds;

    if (nextX <= minX) {
      nextX = minX;
      walkDirection = 1;
    } else if (nextX >= maxX) {
      nextX = maxX;
      walkDirection = -1;
    }

    pet.classList.toggle('facing-left', walkDirection < 0);
    pet.classList.toggle('facing-right', walkDirection > 0);
    await window.bobaDesktop.setWindowPosition({ x: nextX, y: windowY });
  } else {
    pet.classList.add('paused');
  }

  requestAnimationFrame(walkFrame);
}

window.bobaDesktop.onState((state) => {
  setState(state, Boolean(state && state.force));
});

pet.addEventListener('dblclick', () => {
  refreshState(true);
});

pet.addEventListener('pointerdown', async (event) => {
  if (event.button !== 0) return;
  pauseWalking();
  const [windowX, windowY] = await window.bobaDesktop.getWindowPosition();
  dragState = {
    pointerId: event.pointerId,
    startScreenX: event.screenX,
    startScreenY: event.screenY,
    windowX,
    windowY
  };
  pet.classList.add('dragging');
  pet.setPointerCapture(event.pointerId);
});

pet.addEventListener('pointermove', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  const dx = event.screenX - dragState.startScreenX;
  const dy = event.screenY - dragState.startScreenY;
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
  pauseWalking(WALK_RESUME_DELAY_MS);
});

pet.addEventListener('pointercancel', () => {
  pet.classList.remove('dragging');
  dragState = null;
  pauseWalking(WALK_RESUME_DELAY_MS);
});

pet.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  pauseWalking(3000);
  window.bobaDesktop.showMenu();
});

window.addEventListener('beforeunload', () => {
  window.bobaDesktop.savePosition();
});

refreshState(true);
setInterval(() => refreshState(false), 2000);
setTimeout(() => {
  canAutoWalk = true;
  requestAnimationFrame(walkFrame);
}, 1800);
