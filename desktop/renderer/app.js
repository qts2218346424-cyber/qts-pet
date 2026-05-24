'use strict';

const pet = document.getElementById('pet');
const bubble = document.getElementById('bubble');
const message = document.getElementById('message');

let hideTimer = null;
let lastMessage = '';

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

pet.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  window.bobaDesktop.showMenu();
});

window.addEventListener('beforeunload', () => {
  window.bobaDesktop.savePosition();
});

refreshState(true);
setInterval(() => refreshState(false), 2000);
