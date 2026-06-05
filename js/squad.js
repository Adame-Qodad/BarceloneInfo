import { initNavigation } from './nav.js';
import { loadJSON, renderPlayerCard } from './utils.js';

async function initSquad() {
  try {
    const data = await loadJSON('data/team.json');
    const seasonEl = document.getElementById('squadSeason');
    if (seasonEl) seasonEl.textContent = `Saison ${data.season}`;

    renderSquad(data.players);

    document.getElementById('squadFilters').addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      document.querySelectorAll('#squadFilters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSquad(data.players, btn.dataset.position);
    });
  } catch (err) {
    console.error(err);
  }
}

function renderSquad(players, position = 'all') {
  const filtered = position === 'all'
    ? players
    : players.filter(p => p.position === position);

  document.getElementById('squadGrid').innerHTML = filtered.map(renderPlayerCard).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSquad();
});
