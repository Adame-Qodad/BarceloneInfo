import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYERS_DIR = join(__dirname, '..', 'assets', 'players');
const TEAM_PATH = join(__dirname, '..', 'data', 'team.json');

const WIKI_PAGES = {
  'marc-andre-ter-stegen': 'Marc-André_ter_Stegen',
  'wojciech-szczesny': 'Wojciech_Szczęsny',
  'ronald-araujo': 'Ronald_Araújo',
  'pau-cubarsi': 'Pau_Cubarsí',
  'jules-kounde': 'Jules_Koundé',
  'alejandro-balde': 'Alejandro_Balde',
  'eric-garcia': 'Eric_García_(footballer,_born_2001)',
  'pedri': 'Pedri',
  'gavi': 'Gavi_(footballer)',
  'frenkie-de-jong': 'Frenkie_de_Jong',
  'fermin-lopez': 'Fermín_López',
  'dani-olmo': 'Dani_Olmo',
  'marc-bernal': 'FC_Barcelona',
  'robert-lewandowski': 'Robert_Lewandowski',
  'raphinha': 'Raphinha',
  'lamine-yamal': 'Lamine_Yamal',
  'ferran-torres': 'Ferran_Torres',
  'marcus-rashford': 'Marcus_Rashford'
};

async function fetchWikiThumbnail(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PortalBlaugrana/1.0 (fc-barcelona-site)' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.thumbnail?.source || data.originalimage?.source || null;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PortalBlaugrana/1.0 (fc-barcelona-site)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buffer);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  mkdirSync(PLAYERS_DIR, { recursive: true });
  const team = JSON.parse(await import('fs').then(fs => fs.readFileSync(TEAM_PATH, 'utf-8')));

  for (const player of team.players) {
    const wikiTitle = WIKI_PAGES[player.slug];
    if (!wikiTitle) continue;

    const dest = join(PLAYERS_DIR, `${player.slug}.jpg`);
    if (existsSync(dest)) {
      player.photo = `assets/players/${player.slug}.jpg`;
      console.log(`⏭  ${player.name} — photo déjà présente`);
      continue;
    }

    try {
      const thumbUrl = await fetchWikiThumbnail(wikiTitle);
      if (!thumbUrl) {
        console.warn(`⚠️  ${player.name} — pas de photo Wikipedia`);
        continue;
      }
      await sleep(1500);
      await downloadImage(thumbUrl, dest);
      player.photo = `assets/players/${player.slug}.jpg`;
      console.log(`✅ ${player.name}`);
    } catch (err) {
      console.warn(`⚠️  ${player.name}: ${err.message}`);
    }
  }

  writeFileSync(TEAM_PATH, JSON.stringify(team, null, 2), 'utf-8');
  console.log('\n📸 Photos mises à jour dans data/team.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
