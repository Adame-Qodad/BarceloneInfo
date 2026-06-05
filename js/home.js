import { initNavigation } from './nav.js';
import { loadJSON, renderNewsCard, renderPlayerCardCompact } from './utils.js';

async function initHome() {
  try {
    const club = await loadJSON('data/club.json');
    document.getElementById('statTitles').textContent = club.stats.ligaTitles;
    document.getElementById('statUCL').textContent = club.stats.uclTitles;
    document.getElementById('statFounded').textContent = club.stats.founded;
  } catch (err) {
    console.error(err);
  }

  try {
    const news = await loadJSON('data/news.json');
    const articles = (news.articles || []).slice(0, 3);
    document.getElementById('statNews').textContent = news.articles?.length || 0;
    document.getElementById('homeNewsGrid').innerHTML = articles.length
      ? articles.map(renderNewsCard).join('')
      : '<p class="empty-msg">Aucun article disponible.</p>';
  } catch (err) {
    document.getElementById('homeNewsGrid').innerHTML = '<p class="empty-msg">Impossible de charger les actualités.</p>';
  }

  try {
    const team = await loadJSON('data/team.json');
    const featured = team.players.slice(0, 6);
    document.getElementById('homeSquadGrid').innerHTML = featured.map(renderPlayerCardCompact).join('');
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHome();
});
