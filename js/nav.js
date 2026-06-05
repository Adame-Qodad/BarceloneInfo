export function initNavigation() {
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    navMenu.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('open'));
    });
  }

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    const isHome = (currentPage === '' || currentPage === 'index.html') && href === 'index.html';
    const isSquad = currentPage === 'joueur.html' && href === 'effectif.html';
    const isNews = currentPage === 'article.html' && href === 'actualites.html';
    if (href === currentPage || isHome || isSquad || isNews) {
      link.classList.add('active');
    }
  });
}
