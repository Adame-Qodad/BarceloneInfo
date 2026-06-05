import { checkAccess, logout } from './auth.js';
import { DATA_FILES } from './config.js';
import {
  getGithubConfig,
  saveGithubConfig,
  isGithubConfigured,
  testGithubConnection,
  publishAll
} from './github.js';

let teamData = null;
let newsData = null;
let clubData = null;
let editingPlayerIndex = null;
let editingArticleIndex = null;

import { resolvePath } from '../utils.js';

async function loadJSON(path) {
  const url = resolvePath(path);
  const res = await fetch(url + '?t=' + Date.now());
  if (!res.ok) throw new Error(`Impossible de charger ${path}`);
  return res.json();
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 55);
}

function showStatus(msg, type = 'info') {
  const el = document.getElementById('adminStatus');
  el.textContent = msg;
  el.className = `admin-status admin-status--${type}`;
  el.hidden = false;
}

function switchTab(tabId) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.admin-panel').forEach(p => p.hidden = p.id !== `panel-${tabId}`);
}

async function loadAllData() {
  [teamData, newsData, clubData] = await Promise.all([
    loadJSON(DATA_FILES.team),
    loadJSON(DATA_FILES.news),
    loadJSON(DATA_FILES.club)
  ]);
}

function renderPlayers() {
  const list = document.getElementById('playersList');
  list.innerHTML = teamData.players.map((p, i) => `
    <div class="admin-item">
      <div class="admin-item__main">
        <strong>#${p.number} ${p.name}</strong>
        <span>${p.position} · ${p.nationality}</span>
      </div>
      <div class="admin-item__actions">
        <button type="button" class="btn btn--sm" data-edit-player="${i}">Modifier</button>
        <button type="button" class="btn btn--sm btn--danger" data-delete-player="${i}">Suppr.</button>
      </div>
    </div>
  `).join('');
}

function renderArticles() {
  const list = document.getElementById('articlesList');
  const articles = newsData.articles || [];
  list.innerHTML = articles.map((a, i) => `
    <div class="admin-item">
      <div class="admin-item__main">
        <strong>${a.titleFr || a.title}</strong>
        <span>${a.source} · ${a.topic || a.category || '—'} · ${new Date(a.date).toLocaleDateString('fr-FR')}</span>
      </div>
      <div class="admin-item__actions">
        <button type="button" class="btn btn--sm" data-edit-article="${i}">Modifier</button>
        <button type="button" class="btn btn--sm btn--danger" data-delete-article="${i}">Suppr.</button>
      </div>
    </div>
  `).join('');
}

function renderClub() {
  document.getElementById('clubStats').innerHTML = `
    <label>Titres Liga <input type="number" id="statLiga" value="${clubData.stats.ligaTitles}"></label>
    <label>Ligue des Champions <input type="number" id="statUCL" value="${clubData.stats.uclTitles}"></label>
    <label>Fondation <input type="number" id="statFounded" value="${clubData.stats.founded}"></label>
  `;

  document.getElementById('clubInfoList').innerHTML = clubData.info.map((item, i) => `
    <div class="admin-row" data-info="${i}">
      <input type="text" value="${item.label}" data-field="label">
      <input type="text" value="${item.value}" data-field="value">
      <button type="button" class="btn btn--sm btn--danger" data-delete-info="${i}">×</button>
    </div>
  `).join('');

  document.getElementById('historyList').innerHTML = clubData.history.map((item, i) => `
    <div class="admin-block" data-history="${i}">
      <input type="text" value="${item.year}" data-field="year" placeholder="Année">
      <input type="text" value="${item.title}" data-field="title" placeholder="Titre">
      <textarea data-field="description" rows="2">${item.description}</textarea>
      <button type="button" class="btn btn--sm btn--danger" data-delete-history="${i}">Supprimer</button>
    </div>
  `).join('');

  document.getElementById('trophiesList').innerHTML = clubData.trophies.map((item, i) => `
    <div class="admin-row" data-trophy="${i}">
      <input type="text" value="${item.icon}" data-field="icon" style="width:3rem">
      <input type="text" value="${item.name}" data-field="name">
      <input type="number" value="${item.count}" data-field="count" style="width:5rem">
      <button type="button" class="btn btn--sm btn--danger" data-delete-trophy="${i}">×</button>
    </div>
  `).join('');
}

function collectClubFromForm() {
  clubData.stats = {
    ligaTitles: Number(document.getElementById('statLiga').value),
    uclTitles: Number(document.getElementById('statUCL').value),
    founded: Number(document.getElementById('statFounded').value)
  };

  clubData.info = [...document.querySelectorAll('[data-info]')].map(row => ({
    label: row.querySelector('[data-field="label"]').value,
    value: row.querySelector('[data-field="value"]').value
  }));

  clubData.history = [...document.querySelectorAll('[data-history]')].map(row => ({
    year: row.querySelector('[data-field="year"]').value,
    title: row.querySelector('[data-field="title"]').value,
    description: row.querySelector('[data-field="description"]').value
  }));

  clubData.trophies = [...document.querySelectorAll('[data-trophy]')].map(row => ({
    icon: row.querySelector('[data-field="icon"]').value,
    name: row.querySelector('[data-field="name"]').value,
    count: Number(row.querySelector('[data-field="count"]').value)
  }));
}

function openPlayerForm(player = null, index = null) {
  editingPlayerIndex = index;
  const form = document.getElementById('playerForm');
  form.hidden = false;
  document.getElementById('playerFormTitle').textContent = player ? 'Modifier le joueur' : 'Ajouter un joueur';

  const fields = ['name', 'fullName', 'number', 'position', 'nationality', 'country', 'age',
    'birthDate', 'birthPlace', 'height', 'foot', 'joined', 'photo', 'bio'];
  const defaults = { position: 'Milieu', number: '', previousClubs: [] };
  const data = player || defaults;

  fields.forEach(f => {
    const el = form.elements[f];
    if (el) el.value = data[f] ?? '';
  });
  form.elements.previousClubs.value = (data.previousClubs || []).join(', ');
}

function savePlayerForm(e) {
  e.preventDefault();
  const form = e.target;
  const player = {
    slug: editingPlayerIndex !== null
      ? teamData.players[editingPlayerIndex].slug
      : slugify(form.name.value),
    name: form.name.value,
    fullName: form.fullName.value,
    number: Number(form.number.value),
    position: form.position.value,
    nationality: form.nationality.value,
    country: form.country.value,
    age: Number(form.age.value),
    birthDate: form.birthDate.value,
    birthPlace: form.birthPlace.value,
    height: form.height.value,
    foot: form.foot.value,
    joined: form.joined.value,
    photo: form.photo.value || null,
    bio: form.bio.value,
    previousClubs: form.previousClubs.value.split(',').map(s => s.trim()).filter(Boolean)
  };

  if (editingPlayerIndex !== null) {
    teamData.players[editingPlayerIndex] = player;
  } else {
    teamData.players.push(player);
  }

  form.hidden = true;
  editingPlayerIndex = null;
  renderPlayers();
  showStatus('Joueur enregistré localement — pensez à publier.', 'info');
}

function openArticleForm(article = null, index = null) {
  editingArticleIndex = index;
  const form = document.getElementById('articleForm');
  form.hidden = false;
  document.getElementById('articleFormTitle').textContent = article ? 'Modifier l\'article' : 'Ajouter un article';

  const data = article || { topic: 'equipe', date: new Date().toISOString(), category: 'equipe' };
  form.titleFr.value = data.titleFr || data.title || '';
  form.summaryFr.value = data.summaryFr || data.excerpt || '';
  form.source.value = data.source || '';
  form.topic.value = data.topic || data.category || 'equipe';
  form.date.value = data.date ? data.date.slice(0, 16) : '';
  form.link.value = data.link || '';
  form.image.value = data.image || '';
  form.slug.value = data.slug || '';
}

function saveArticleForm(e) {
  e.preventDefault();
  const form = e.target;
  const titleFr = form.titleFr.value;
  const article = {
    title: editingArticleIndex !== null ? newsData.articles[editingArticleIndex].title : titleFr,
    titleFr,
    summaryFr: form.summaryFr.value,
    excerpt: form.summaryFr.value.slice(0, 250),
    source: form.source.value,
    topic: form.topic.value,
    category: form.topic.value,
    date: new Date(form.date.value).toISOString(),
    link: form.link.value,
    image: form.image.value || null,
    slug: form.slug.value || slugify(titleFr) + '-' + Date.now().toString(36).slice(-4)
  };

  if (editingArticleIndex !== null) {
    newsData.articles[editingArticleIndex] = article;
  } else {
    newsData.articles.unshift(article);
  }

  form.hidden = true;
  editingArticleIndex = null;
  renderArticles();
  showStatus('Article enregistré localement — pensez à publier.', 'info');
}

function loadGithubSettings() {
  const config = getGithubConfig();
  document.getElementById('ghOwner').value = config.owner || '';
  document.getElementById('ghRepo').value = config.repo || '';
  document.getElementById('ghBranch').value = config.branch || 'main';
  document.getElementById('ghToken').value = config.token || '';
  updateGithubBadge();
}

function updateGithubBadge() {
  const badge = document.getElementById('githubBadge');
  badge.textContent = isGithubConfigured() ? 'GitHub connecté' : 'GitHub non configuré';
  badge.className = 'admin-badge ' + (isGithubConfigured() ? 'admin-badge--ok' : 'admin-badge--warn');
}

async function saveGithubSettings(e) {
  e.preventDefault();
  saveGithubConfig({
    owner: document.getElementById('ghOwner').value.trim(),
    repo: document.getElementById('ghRepo').value.trim(),
    branch: document.getElementById('ghBranch').value.trim() || 'main',
    token: document.getElementById('ghToken').value.trim()
  });
  updateGithubBadge();
  showStatus('Paramètres GitHub enregistrés.', 'success');
}

async function testGithub() {
  try {
    await testGithubConnection();
    showStatus('Connexion GitHub OK !', 'success');
  } catch (err) {
    showStatus('Erreur : ' + err.message, 'error');
  }
}

async function publishToGithub() {
  if (!isGithubConfigured()) {
    showStatus('Configurez GitHub dans Paramètres avant de publier.', 'error');
    switchTab('settings');
    return;
  }

  collectClubFromForm();
  document.getElementById('teamSeason').value && (teamData.season = document.getElementById('teamSeason').value);
  newsData.lastUpdated = new Date().toISOString();

  const btn = document.getElementById('publishBtn');
  btn.disabled = true;
  showStatus('Publication en cours sur GitHub…', 'info');

  try {
    await publishAll([
      ['effectif', DATA_FILES.team, teamData],
      ['actualités', DATA_FILES.news, newsData],
      ['club', DATA_FILES.club, clubData]
    ]);

    showStatus(
      'Publié sur GitHub ! Le site se mettra à jour dans 1-2 minutes (déploiement GitHub Pages).',
      'success'
    );
  } catch (err) {
    showStatus('Erreur de publication : ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function bindEvents() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('publishBtn').addEventListener('click', publishToGithub);
  document.getElementById('addPlayerBtn').addEventListener('click', () => openPlayerForm());
  document.getElementById('addArticleBtn').addEventListener('click', () => openArticleForm());
  document.getElementById('playerForm').addEventListener('submit', savePlayerForm);
  document.getElementById('cancelPlayerBtn').addEventListener('click', () => {
    document.getElementById('playerForm').hidden = true;
  });
  document.getElementById('articleForm').addEventListener('submit', saveArticleForm);
  document.getElementById('cancelArticleBtn').addEventListener('click', () => {
    document.getElementById('articleForm').hidden = true;
  });
  document.getElementById('githubForm').addEventListener('submit', saveGithubSettings);
  document.getElementById('testGithubBtn').addEventListener('click', testGithub);

  document.getElementById('teamSeason').addEventListener('change', e => {
    teamData.season = e.target.value;
  });

  document.getElementById('playersList').addEventListener('click', e => {
    const edit = e.target.closest('[data-edit-player]');
    const del = e.target.closest('[data-delete-player]');
    if (edit) openPlayerForm(teamData.players[Number(edit.dataset.editPlayer)], Number(edit.dataset.editPlayer));
    if (del && confirm('Supprimer ce joueur ?')) {
      teamData.players.splice(Number(del.dataset.deletePlayer), 1);
      renderPlayers();
    }
  });

  document.getElementById('articlesList').addEventListener('click', e => {
    const edit = e.target.closest('[data-edit-article]');
    const del = e.target.closest('[data-delete-article]');
    if (edit) openArticleForm(newsData.articles[Number(edit.dataset.editArticle)], Number(edit.dataset.editArticle));
    if (del && confirm('Supprimer cet article ?')) {
      newsData.articles.splice(Number(del.dataset.deleteArticle), 1);
      renderArticles();
    }
  });

  document.getElementById('addInfoBtn').addEventListener('click', () => {
    clubData.info.push({ label: '', value: '' });
    renderClub();
  });
  document.getElementById('addHistoryBtn').addEventListener('click', () => {
    clubData.history.push({ year: '', title: '', description: '' });
    renderClub();
  });
  document.getElementById('addTrophyBtn').addEventListener('click', () => {
    clubData.trophies.push({ icon: '🏆', name: '', count: 0 });
    renderClub();
  });

  document.getElementById('panel-club').addEventListener('click', e => {
    if (e.target.dataset.deleteInfo !== undefined) {
      clubData.info.splice(Number(e.target.dataset.deleteInfo), 1);
      renderClub();
    }
    if (e.target.dataset.deleteHistory !== undefined) {
      clubData.history.splice(Number(e.target.dataset.deleteHistory), 1);
      renderClub();
    }
    if (e.target.dataset.deleteTrophy !== undefined) {
      clubData.trophies.splice(Number(e.target.dataset.deleteTrophy), 1);
      renderClub();
    }
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    collectClubFromForm();
    downloadJSON(teamData, 'team.json');
    downloadJSON(newsData, 'news.json');
    downloadJSON(clubData, 'club.json');
    showStatus('Fichiers JSON téléchargés.', 'success');
  });
}

async function init() {
  if (!checkAccess()) {
    document.body.innerHTML = '<p style="text-align:center;padding:4rem;color:#94a3b8;">Accès refusé.</p>';
    return;
  }

  await loadAllData();
  document.getElementById('teamSeason').value = teamData.season;
  renderPlayers();
  renderArticles();
  renderClub();
  loadGithubSettings();
  bindEvents();
}

init().catch(err => showStatus('Erreur : ' + err.message, 'error'));
