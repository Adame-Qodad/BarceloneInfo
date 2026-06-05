import { initNavigation } from './nav.js';
import { loadJSON } from './utils.js';

async function initTrophiesPage() {
  try {
    const data = await loadJSON('data/club.json');
    document.getElementById('trophiesGrid').innerHTML = data.trophies.map(trophy => `
      <div class="trophy-card">
        <div class="trophy-card__icon">${trophy.icon}</div>
        <div class="trophy-card__count">${trophy.count}</div>
        <div class="trophy-card__name">${trophy.name}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTrophiesPage();
});
