// frontend/renderer.js
// This file runs in the renderer and has access to window.api (from preload)

window.addEventListener('DOMContentLoaded', () => {
  const minBtn = document.getElementById('min-btn');
  const maxBtn = document.getElementById('max-btn');
  const closeBtn = document.getElementById('close-btn');

  if (minBtn) minBtn.addEventListener('click', () => window.api.minimize());
  if (maxBtn) maxBtn.addEventListener('click', () => window.api.maximize());
  if (closeBtn) closeBtn.addEventListener('click', () => window.api.close());
});
