import { initNavigation } from './nav.js';
import { loadJSON } from './utils.js';

function getSlug() {
  return new URLSearchParams(window.location.search).get('slug');
}

function renderPlayer(player) {
  document.title = `${player.name} — FC Barcelone`;
  document.getElementById('playerName').textContent = player.name;
  document.getElementById('playerFullName').textContent = player.fullName || player.name;
  document.getElementById('playerNumber').textContent = player.number;
  document.getElementById('playerPosition').textContent = player.position;
  document.getElementById('playerNationality').textContent = player.nationality;
  document.getElementById('playerBio').textContent = player.bio;

  const photoEl = document.getElementById('playerPhoto');
  if (player.photo) {
    photoEl.src = player.photo;
    photoEl.alt = player.name;
  } else {
    photoEl.replaceWith(Object.assign(document.createElement('div'), {
      className: 'player-profile__photo player-profile__photo--fallback',
      id: 'playerPhoto',
      textContent: player.number
    }));
  }

  const details = [
    { label: 'Nom complet', value: player.fullName },
    { label: 'Âge', value: `${player.age} ans` },
    { label: 'Date de naissance', value: player.birthDate },
    { label: 'Lieu de naissance', value: player.birthPlace },
    { label: 'Nationalité', value: player.country },
    { label: 'Taille', value: player.height },
    { label: 'Pied fort', value: player.foot },
    { label: 'Au club depuis', value: player.joined },
    { label: 'Clubs précédents', value: (player.previousClubs || []).join(', ') }
  ];

  document.getElementById('playerDetails').innerHTML = details.map(d => `
    <div class="detail-row">
      <span class="detail-row__label">${d.label}</span>
      <span class="detail-row__value">${d.value || '—'}</span>
    </div>
  `).join('');
}

async function initPlayer() {
  const slug = getSlug();
  if (!slug) {
    window.location.href = 'effectif.html';
    return;
  }

  try {
    const data = await loadJSON('data/team.json');
    const player = data.players.find(p => p.slug === slug);

    if (!player) {
      document.querySelector('.player-profile').innerHTML =
        '<p class="empty-msg">Joueur introuvable. <a href="effectif.html">Retour à l\'effectif</a></p>';
      return;
    }

    renderPlayer(player);

    const others = data.players
      .filter(p => p.slug !== slug && p.position === player.position)
      .slice(0, 3);

    if (others.length) {
      document.getElementById('relatedPlayers').innerHTML = others.map(p => `
        <a href="joueur.html?slug=${p.slug}" class="related-player">
          ${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : `<div class="related-player__fallback">${p.number}</div>`}
          <span>${p.name}</span>
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
  initPlayer();
});
