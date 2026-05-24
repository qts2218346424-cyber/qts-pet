'use strict';

const pet = document.getElementById('pet');
const bubble = document.getElementById('bubble');
const message = document.getElementById('message');
const fpsBadge = document.getElementById('fps');
const infoPanel = document.getElementById('info-panel');
const infoTitle = document.getElementById('info-title');
const infoMessage = document.getElementById('info-message');

let hideTimer = null;
let infoHideTimer = null;
let lastMessage = '';
let dragState = null;
let walkDirection = 1;
let walkPausedUntil = 0;
let canAutoWalk = false;
let walkingEnabled = true;
let cachedWorkArea = null;
let currentWindowPosition = null;
let fpsFrames = 0;
let fpsLastAt = performance.now();
let lookMode = 'dance';
let currentMood = 'idle';
let danceMode = true;

const IDLE_TEXT = '\u0042\u006f\u0062\u0061 \u6b63\u5728\u5f85\u547d\u3002';
const IDLE_CHATTER = [
  '\u0042\u006f\u0062\u0061 \u6b63\u5728\u5f85\u547d\u3002',
  '\u6211\u5728\u8fd9\u91cc\u966a\u4f60\u3002',
  '\u8981\u5f00\u59cb\u4e00\u4e2a\u65b0\u4efb\u52a1\u5417\uff1f',
  '\u8bb0\u5f97\u5076\u5c14\u4f11\u606f\u4e00\u4e0b\u3002'
];
const WALK_SPEED_PX_PER_SECOND = 12;
const WALK_TICK_MS = 1200;
const WALK_RESUME_DELAY_MS = 2000;
let idleChatterIndex = 0;

function setState(state, force = false) {
  const isIdle = !state || state.status === 'idle';
  const nextMessage = isIdle ? getIdleMessage(force) : (state.message || IDLE_TEXT);
  const mood = state && state.mood ? state.mood : 'idle';
  currentMood = mood;

  applyPetClasses(mood);
  message.textContent = nextMessage;

  if (force || nextMessage !== lastMessage) {
    showBubble();
  }

  lastMessage = nextMessage;
}

function applyPetClasses(mood = 'idle') {
  const classes = [
    'pet',
    `mood-${mood}`,
    walkDirection < 0 ? 'facing-left' : 'facing-right',
    `look-${lookMode}`,
    danceMode ? 'dance-mode' : 'step-mode'
  ];

  if (!walkingEnabled || performance.now() < walkPausedUntil) {
    classes.push('paused');
  }
  if (dragState) {
    classes.push('dragging');
  }

  pet.className = classes.join(' ');
}

function getIdleMessage(force) {
  if (force) {
    idleChatterIndex = (idleChatterIndex + 1) % IDLE_CHATTER.length;
  }
  return IDLE_CHATTER[idleChatterIndex];
}

function showBubble() {
  pauseWalking(3500);
  bubble.classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    bubble.classList.add('hidden');
  }, 5000);
}

function showInfoPanel(command) {
  pauseWalking(1800);
  infoTitle.textContent = command.title || '\u72b6\u6001';
  infoMessage.textContent = command.message || '';
  infoPanel.className = `info-panel mood-${command.mood || 'idle'}`;
  clearTimeout(infoHideTimer);
  infoHideTimer = setTimeout(() => {
    infoPanel.classList.add('hidden');
  }, 9000);
}

function pauseWalking(durationMs = WALK_RESUME_DELAY_MS) {
  walkPausedUntil = Math.max(walkPausedUntil, performance.now() + durationMs);
  pet.classList.add('paused');
}

async function refreshState(force = false) {
  const state = await window.bobaDesktop.getState();
  setState(state, force);
}

async function refreshWorkArea() {
  cachedWorkArea = await window.bobaDesktop.getWorkArea();
}

async function walkTick() {
  const now = performance.now();
  danceMode = Math.random() > 0.28;

  if (walkingEnabled && canAutoWalk && !dragState && now >= walkPausedUntil) {
    pet.classList.remove('paused');
    if (danceMode) {
      lookMode = 'dance';
      applyPetClasses(currentMood);
      return;
    }

    lookMode = 'side';
    if (!currentWindowPosition) {
      const [windowX, windowY] = await window.bobaDesktop.getWindowPosition();
      currentWindowPosition = { x: windowX, y: windowY };
    }
    if (!cachedWorkArea) {
      await refreshWorkArea();
    }
    const windowX = currentWindowPosition.x;
    const windowY = currentWindowPosition.y;
    const workArea = cachedWorkArea;
    const petWidth = 240;
    const minX = workArea.x + 40;
    const maxX = workArea.x + workArea.width - petWidth - 80;
    let nextX = windowX + walkDirection * WALK_SPEED_PX_PER_SECOND * 0.7;

    if (nextX <= minX) {
      nextX = minX;
      walkDirection = 1;
    } else if (nextX >= maxX) {
      nextX = maxX;
      walkDirection = -1;
    }

    pet.classList.toggle('facing-left', walkDirection < 0);
    pet.classList.toggle('facing-right', walkDirection > 0);
    pet.classList.toggle('look-side', true);
    pet.classList.toggle('look-dance', false);
    pet.classList.toggle('look-up', false);
    currentWindowPosition = { x: nextX, y: windowY };
    await window.bobaDesktop.setWindowPosition({ x: nextX, y: windowY });
  } else {
    pet.classList.add('paused');
  }
}

function updateIdleLook() {
  if (dragState || (walkingEnabled && canAutoWalk && performance.now() >= walkPausedUntil)) return;
  const modes = ['dance', 'side', 'up', 'dance'];
  lookMode = modes[Math.floor(Math.random() * modes.length)];
  if (lookMode === 'side') {
    walkDirection = Math.random() > 0.5 ? 1 : -1;
  }
  applyPetClasses(currentMood);
}

function toggleWalking() {
  walkingEnabled = !walkingEnabled;
  if (walkingEnabled) {
    pauseWalking(600);
    setState({
      status: 'notice',
      message: '\u5df2\u7ee7\u7eed\u884c\u8d70\uff0c\u6211\u4f1a\u6162\u4e00\u70b9\u3002',
      mood: 'settled'
    }, true);
  } else {
    pauseWalking(60 * 60 * 1000);
    setState({
      status: 'notice',
      message: '\u5df2\u6682\u505c\u884c\u8d70\uff0c\u73b0\u5728\u4e0d\u4f1a\u4e71\u8dd1\u3002',
      mood: 'gentle_prompt'
    }, true);
  }
}

function measureFps(now) {
  fpsFrames += 1;

  if (now - fpsLastAt >= 1000) {
    const fps = Math.round((fpsFrames * 1000) / (now - fpsLastAt));
    fpsBadge.textContent = `FPS ${fps}`;
    fpsFrames = 0;
    fpsLastAt = now;
  }

  requestAnimationFrame(measureFps);
}

window.bobaDesktop.onState((state) => {
  setState(state, Boolean(state && state.force));
});

window.bobaDesktop.onCommand((command) => {
  if (!command) return;
  if (command.type === 'toggle-walking') {
    toggleWalking();
  }
  if (command.type === 'show-info-panel') {
    showInfoPanel(command);
  }
});

pet.addEventListener('dblclick', () => {
  refreshState(true);
});

pet.addEventListener('pointerdown', async (event) => {
  if (event.button !== 0) return;
  pauseWalking();
  const [windowX, windowY] = await window.bobaDesktop.getWindowPosition();
  currentWindowPosition = { x: windowX, y: windowY };
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
  currentWindowPosition = {
    x: dragState.windowX + dx,
    y: dragState.windowY + dy
  };
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

pet.addEventListener('mouseenter', () => {
  pauseWalking(4500);
});

window.addEventListener('beforeunload', () => {
  window.bobaDesktop.savePosition();
});

refreshState(true);
refreshWorkArea();
requestAnimationFrame(measureFps);
setInterval(() => refreshState(false), 10000);
setInterval(() => refreshState(true), 45000);
setInterval(() => refreshWorkArea(), 30000);
setInterval(updateIdleLook, 3600);
setTimeout(() => {
  canAutoWalk = true;
  setInterval(() => {
    walkTick();
  }, WALK_TICK_MS);
}, 1800);
