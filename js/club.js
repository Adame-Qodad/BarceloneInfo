import { initNavigation } from './nav.js';
import { loadJSON } from './utils.js';

async function initClubPage() {
  try {
    const data = await loadJSON('data/club.json');
    document.getElementById('clubInfo').innerHTML = data.info.map(item => `
      <div class="club-card">
        <h3>${item.label}</h3>
        <p>${item.value}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initClubPage();
});
