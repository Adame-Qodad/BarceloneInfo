import { initNavigation } from './nav.js';
import { loadJSON, formatDate, renderNewsCard } from './utils.js';

const NEWS_PER_PAGE = 9;
let allNews = [];
let visibleCount = NEWS_PER_PAGE;
let currentFilter = 'all';

function getFilteredNews() {
  if (currentFilter === 'all') return allNews;
  return allNews.filter(n => (n.topic || n.category) === currentFilter);
}

function renderNews() {
  const grid = document.getElementById('newsGrid');
  const filtered = getFilteredNews();
  const visible = filtered.slice(0, visibleCount);

  if (visible.length === 0) {
    grid.innerHTML = '<p class="empty-msg">Aucun article disponible pour le moment.</p>';
    document.getElementById('loadMoreNews').hidden = true;
    return;
  }

  grid.innerHTML = visible.map(renderNewsCard).join('');
  document.getElementById('loadMoreNews').hidden = visibleCount >= filtered.length;
}

async function initNews() {
  try {
    const data = await loadJSON('data/news.json');
    allNews = data.articles || [];
    visibleCount = NEWS_PER_PAGE;

    document.getElementById('lastUpdate').textContent =
      `Dernière mise à jour : ${formatDate(data.lastUpdated)}`;

    renderNews();
  } catch (err) {
    document.getElementById('newsGrid').innerHTML =
      '<p class="empty-msg">Impossible de charger les actualités.</p>';
    console.error(err);
  }
}

function initNewsFilters() {
  document.getElementById('newsFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    document.querySelectorAll('#newsFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    visibleCount = NEWS_PER_PAGE;
    renderNews();
  });

  document.getElementById('loadMoreNews').addEventListener('click', () => {
    visibleCount += NEWS_PER_PAGE;
    renderNews();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initNews();
  initNewsFilters();
});
