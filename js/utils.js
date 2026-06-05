export async function loadJSON(path) {
  const base = document.querySelector('base')?.href || window.location.origin + '/';
  const url = path.startsWith('http') ? path : new URL(path, base).href;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur chargement ${path}`);
  return response.json();
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getCategoryLabel(category) {
  const labels = {
    official: 'Officiel',
    media: 'Presse',
    international: 'International',
    equipe: 'Équipe première',
    mercato: 'Mercato'
  };
  return labels[category] || category;
}

export function getTopicLabel(topic) {
  return getCategoryLabel(topic);
}

export function renderNewsCard(article) {
  const imageHtml = article.image
    ? `<img class="news-card__image" src="${article.image}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'news-card__image news-card__image--placeholder',textContent:'⚽'}))">`
    : `<div class="news-card__image news-card__image--placeholder">⚽</div>`;

  const title = article.titleFr || article.title;
  const excerpt = article.summaryFr || article.excerpt || '';
  const href = article.slug ? `article.html?slug=${article.slug}` : article.link;
  const badge = article.topic || article.category;

  return `
    <article class="news-card" data-category="${badge}">
      ${imageHtml}
      <div class="news-card__body">
        <div class="news-card__meta">
          <span class="news-card__source">${article.source}</span>
          <span class="news-card__category news-card__category--${badge}">${getCategoryLabel(badge)}</span>
          <span class="news-card__date">${formatDate(article.date)}</span>
        </div>
        <h3 class="news-card__title">
          <a href="${href}">${title}</a>
        </h3>
        <p class="news-card__excerpt">${excerpt}</p>
        <a href="${href}" class="news-card__link">
          Lire le résumé →
        </a>
      </div>
    </article>
  `;
}

export function renderPlayerCard(player) {
  const photoHtml = player.photo
    ? `<img class="player-card__photo" src="${player.photo}" alt="${player.name}" loading="lazy" onerror="this.classList.add('player-card__photo--fallback')">`
    : `<div class="player-card__photo player-card__photo--fallback">${player.number}</div>`;

  return `
    <a href="joueur.html?slug=${player.slug}" class="player-card" data-position="${player.position}">
      ${photoHtml}
      <div class="player-card__info">
        <div class="player-card__number">${player.number}</div>
        <h3>${player.name}</h3>
        <div class="player-card__position">${player.position}</div>
        <div class="player-card__nationality">${player.nationality}</div>
      </div>
    </a>
  `;
}

export function renderPlayerCardCompact(player) {
  const photoHtml = player.photo
    ? `<img class="player-card__photo" src="${player.photo}" alt="${player.name}" loading="lazy">`
    : `<div class="player-card__photo player-card__photo--fallback">${player.number}</div>`;

  return `
    <a href="joueur.html?slug=${player.slug}" class="player-card player-card--compact" data-position="${player.position}">
      ${photoHtml}
      <div class="player-card__info">
        <h3>${player.name}</h3>
        <div class="player-card__position">${player.position} · #${player.number}</div>
      </div>
    </a>
  `;
}
