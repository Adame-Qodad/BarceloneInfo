import { initNavigation } from './nav.js';
import { loadJSON } from './utils.js';

async function initHistoryPage() {
  try {
    const data = await loadJSON('data/club.json');
    document.getElementById('timeline').innerHTML = data.history.map(item => `
      <div class="timeline-item">
        <div class="timeline-item__year">${item.year}</div>
        <div class="timeline-item__title">${item.title}</div>
        <div class="timeline-item__desc">${item.description}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHistoryPage();
});
