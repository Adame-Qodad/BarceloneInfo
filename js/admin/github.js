import { GITHUB_STORAGE_KEY } from './config.js';

export function getGithubConfig() {
  try {
    return JSON.parse(localStorage.getItem(GITHUB_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveGithubConfig(config) {
  localStorage.setItem(GITHUB_STORAGE_KEY, JSON.stringify(config));
}

export function isGithubConfigured() {
  const c = getGithubConfig();
  return Boolean(c.token && c.owner && c.repo);
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function githubFetch(path, options = {}) {
  const config = getGithubConfig();
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Erreur GitHub ${res.status}`);
  }
  return data;
}

export async function testGithubConnection() {
  const config = getGithubConfig();
  await githubFetch(`/repos/${config.owner}/${config.repo}`);
  return true;
}

export async function publishFile(filePath, contentObj, commitMessage) {
  const config = getGithubConfig();
  const branch = config.branch || 'main';
  const content = JSON.stringify(contentObj, null, 2);

  let sha;
  try {
    const existing = await githubFetch(
      `/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${branch}`
    );
    sha = existing.sha;
  } catch {
    sha = undefined;
  }

  const body = {
    message: commitMessage,
    content: toBase64(content),
    branch
  };
  if (sha) body.sha = sha;

  await githubFetch(`/repos/${config.owner}/${config.repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return { filePath, commitMessage };
}

export async function publishAll(files, messagePrefix = 'Admin') {
  const results = [];
  for (const [label, filePath, data] of files) {
    const result = await publishFile(
      filePath,
      data,
      `${messagePrefix}: mise à jour ${label}`
    );
    results.push(result);
  }
  return results;
}
