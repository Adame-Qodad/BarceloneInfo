import Parser from 'rss-parser';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { filterFirstTeamNews, classifyArticle } from './news-filter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'data', 'news.json');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure']
    ]
  },
  timeout: 15000
});

const FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=FC+Barcelona+mercato+transfert+premiere+equipe+-femme+-femenino&hl=fr&gl=FR&ceid=FR:fr',
    source: 'Google News Mercato',
    category: 'mercato'
  },
  {
    url: 'https://news.google.com/rss/search?q=Bar%C3%A7a+mercato+OR+transfert+OR+rumeur+site:marca.com&hl=fr&gl=FR&ceid=FR:fr',
    source: 'Marca Mercato',
    category: 'mercato'
  },
  {
    url: 'https://news.google.com/rss/search?q=FC+Barcelona+first+team+OR+%C3%A9quipe+premi%C3%A8re+-femme+-femenino&hl=fr&gl=FR&ceid=FR:fr',
    source: 'Google News',
    category: 'equipe'
  },
  {
    url: 'https://www.marca.com/rss/futbol/barcelona.xml',
    source: 'Marca',
    category: 'equipe'
  }
];

function extractImage(item) {
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) return item.enclosure.url;

  const html = item.content || item['content:encoded'] || item.summary || '';
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch) return imgMatch[1];

  return null;
}

function stripHtml(html, maxLength = 800) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüç]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateSlug(title, link) {
  const base = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 55);

  let hash = 0;
  for (let i = 0; i < link.length; i++) {
    hash = ((hash << 5) - hash + link.charCodeAt(i)) | 0;
  }
  return `${base}-${Math.abs(hash).toString(36).slice(0, 6)}`;
}

function looksFrench(text) {
  if (!text) return false;
  const frenchMarkers = /\b(le|la|les|de|du|des|un|une|est|pour|dans|avec|sur|que|qui|barça|barcelone|mercato|équipe|joueur|match|saison|meilleur|sélection)\b/i;
  const spanishMarkers = /\b(el|la|los|las|del|para|con|por|equipo|partido|temporada|fútbol|futbol|mejor|jugador|seleccionado|elegido)\b/i;
  return frenchMarkers.test(text) && !spanishMarkers.test(text);
}

function looksSpanish(text) {
  if (!text) return false;
  return /\b(el|la|los|las|del|para|con|por|equipo|partido|temporada|fútbol|futbol|mejor|jugador|seleccionado|elegido|autor|arrêt)\b/i.test(text);
}

function detectLangPair(text) {
  if (looksFrench(text)) return null;
  if (looksSpanish(text)) return 'es|fr';
  return 'en|fr';
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function translateToFrench(text) {
  if (!text) return text;

  const langpair = detectLangPair(text);
  if (!langpair) return text;

  const chunks = [];
  const maxLen = 450;
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }

  const parts = [];
  for (const chunk of chunks) {
    await sleep(350);
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langpair}`;
      const res = await fetch(url);
      const data = await res.json();
      const translated = data.responseData?.translatedText || chunk;
      if (translated.includes('PLEASE SELECT') || translated.includes('MYMEMORY WARNING')) {
        parts.push(chunk);
      } else {
        parts.push(translated);
      }
    } catch {
      parts.push(chunk);
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

async function fetchFeed(feedConfig) {
  try {
    console.log(`📡 Fetching: ${feedConfig.source} (${feedConfig.url})`);
    const feed = await parser.parseURL(feedConfig.url);

    return (feed.items || []).map(item => {
      const title = item.title?.trim() || 'Sans titre';
      const link = item.link || item.guid || '#';
      const rawContent = stripHtml(item.contentSnippet || item.summary || item.content, 800);

      return {
        title,
        link,
        excerpt: rawContent.slice(0, 250),
        date: item.isoDate || item.pubDate || new Date().toISOString(),
        source: feedConfig.source,
        category: feedConfig.category,
        image: extractImage(item),
        rawContent
      };
    });
  } catch (error) {
    console.warn(`⚠️  Échec ${feedConfig.source}: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('🔵🔴 Agrégation des actualités FC Barcelone...\n');

  const results = await Promise.all(FEEDS.map(fetchFeed));
  const allArticles = results.flat();

  const seen = new Set();
  const deduped = allArticles
    .filter(article => {
      const key = normalizeTitle(article.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return article.title.length > 10;
    });

  const filtered = filterFirstTeamNews(deduped);
  console.log(`🔍 ${deduped.length} articles récupérés → ${filtered.length} après filtre équipe première / mercato\n`);

  const uniqueArticles = filtered
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 50);

  if (uniqueArticles.length === 0) {
    if (existsSync(OUTPUT_PATH)) {
      console.warn('\n⚠️  Aucun article récupéré — conservation du fichier existant.');
      process.exit(0);
    }
    console.warn('\n⚠️  Aucun article récupéré et aucun fichier existant.');
  }

  console.log(`\n🇫🇷 Traduction de ${uniqueArticles.length} articles en français...\n`);

  for (let i = 0; i < uniqueArticles.length; i++) {
    const article = uniqueArticles[i];
    article.slug = generateSlug(article.title, article.link);
    article.topic = classifyArticle(article);
    article.titleFr = await translateToFrench(article.title);
    article.summaryFr = await translateToFrench(article.rawContent || article.excerpt);
    delete article.rawContent;

    console.log(`   [${i + 1}/${uniqueArticles.length}] ${article.titleFr.slice(0, 60)}...`);
  }

  const output = {
    lastUpdated: new Date().toISOString(),
    articles: uniqueArticles
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ ${uniqueArticles.length} articles sauvegardés dans data/news.json`);
  console.log(`   Dernière mise à jour: ${output.lastUpdated}`);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
