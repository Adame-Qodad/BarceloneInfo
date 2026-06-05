import { ADMIN_KEY } from './config.js';

export function checkAccess() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get('key');

  if (key === ADMIN_KEY) {
    sessionStorage.setItem('admin_auth', '1');
    params.delete('key');
    const clean = params.toString();
    history.replaceState({}, '', `admin.html${clean ? '?' + clean : ''}`);
    return true;
  }

  return sessionStorage.getItem('admin_auth') === '1';
}

export function logout() {
  sessionStorage.removeItem('admin_auth');
  window.location.href = 'index.html';
}
