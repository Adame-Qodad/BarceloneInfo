import { initNavigation } from './nav.js';
import { loadJSON, formatDate, getCategoryLabel } from './utils.js';

function getSlug() {
  return new URLSearchParams(window.location.search).get('slug');
}

function renderArticle(article) {
  const title = article.titleFr || article.title;
  document.title = `${title} — FC Barcelone`;

  document.getElementById('articleTitle').textContent = title;
  document.getElementById('articleSource').textContent = article.source;
  document.getElementById('articleDate').textContent = formatDate(article.date);
  document.getElementById('articleCategory').textContent = getCategoryLabel(article.topic || article.category);
  document.getElementById('articleCategory').className =
    `article-page__category article-page__category--${article.topic || article.category}`;
  document.getElementById('articleSummary').textContent = article.summaryFr || article.excerpt || '';
  document.getElementById('articleOriginalLink').href = article.link;
  const sourceNameEl = document.getElementById('articleSourceName');
  if (sourceNameEl) sourceNameEl.textContent = article.source;

  const imageEl = document.getElementById('articleImage');
  if (article.image) {
    imageEl.src = article.image;
    imageEl.alt = title;
  } else {
    imageEl.replaceWith(Object.assign(document.createElement('div'), {
      className: 'article-page__image article-page__image--placeholder',
      id: 'articleImage',
      textContent: '⚽'
    }));
  }
}

async function initArticle() {
  const slug = getSlug();
  if (!slug) {
    window.location.href = 'actualites.html';
    return;
  }

  try {
    const data = await loadJSON('data/news.json');
    const article = data.articles.find(a => a.slug === slug);

    if (!article) {
      document.querySelector('.article-page').innerHTML =
        '<p class="empty-msg">Article introuvable. <a href="actualites.html">Retour aux actualités</a></p>';
      return;
    }

    renderArticle(article);

    const related = data.articles
      .filter(a => a.slug !== slug && (a.topic || a.category) === (article.topic || article.category))
      .slice(0, 3);

    if (related.length) {
      document.getElementById('relatedArticles').innerHTML = related.map(a => `
        <a href="article.html?slug=${a.slug}" class="related-article">
          <span class="related-article__date">${formatDate(a.date)}</span>
          <span class="related-article__title">${a.titleFr || a.title}</span>
        </a>
      `).join('');
    } else {
      document.getElementById('relatedSection').hidden = true;
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initArticle();
});
