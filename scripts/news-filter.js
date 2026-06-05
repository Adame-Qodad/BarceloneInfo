/** Filtre actualités : équipe première masculine + mercato uniquement */

const FIRST_TEAM_PLAYERS = [
  'ter stegen', 'szczęsny', 'szczesny', 'araújo', 'araujo', 'cubarsí', 'cubarsi',
  'koundé', 'kounde', 'balde', 'garcía', 'garcia', 'pedri', 'gavi', 'de jong',
  'frenkie', 'fermín', 'fermin', 'olmo', 'bernal', 'lewandowski', 'raphinha',
  'yamal', 'lamine', 'ferran torres', 'rashford', 'christensen', 'iñigo', 'inigo'
];

const STAFF_KEYWORDS = [
  'flick', 'hansi flick', 'deco', 'yuste', 'entraîneur', 'entrenador', 'coach'
];

const MERCATO_KEYWORDS = [
  'mercato', 'transfer', 'transfert', 'traspaso', 'fichaje', 'fichage',
  'rumeur', 'rumor', 'rumour', 'signing', 'recrutement', 'prêt', 'pret',
  'loan', 'option d\'achat', 'opción de compra', 'clause', 'cláusula',
  'mercato', 'mercato estival', 'mercato hivernal', 'agent libre'
];

const EXCLUDE_URL = [
  /\/cantera\//i,
  /\/femen/i,
  /\/filial\//i,
  /\/baloncesto\//i,
  /\/balonmano\//i,
  /\/futsal\//i,
  /\/hockey\//i,
  /tickets-official/i,
  /\/real-madrid\//i,
  /\/radio\//i,
  /\/futbol\/seleccion\//i,
  /policia.*valencia-barcelona/i,
  /policia-detiene/i
];

const EXCLUDE_TEXT = [
  /\bfemme\b/i,
  /\bfemenin/i,
  /\bfemenino\b/i,
  /\bwomen\b/i,
  /\bofficial store\b/i,
  /\bbarça official store\b/i,
  /\bbouteille\b/i,
  /\bveste anthem\b/i,
  /\blaliga futures\b/i,
  /\bbarça legends\b/i,
  /\bbarca legends\b/i,
  /\bconvocadas\b.*\bnovias\b/i,
  /\bsamuel eto/i,
  /\bhacienda\b/i,
  /\bpublicidad\b/i,
  /\bbebida\b/i,
  /\bwild project\b/i,
  /\bdispar(?:ezca|eciera)\b/i,
  /\bjoan garcia\b/i,
  /\btunkara\b/i,
  /\buefa.*ranking\b/i,
  /\branking definitivo.*bayern\b/i,
  /\bbarça fans\b/i,
  /\bsigned kit\b/i,
  /\b15 years since\b/i,
  /\b100 days as\b.*coach/i,
  /\bquim junyent\b/i,
  /\bjakobczyk\b/i,
  /\bdro fernandez\b/i,
  /\bederson castillo\b/i,
  /\bpepites de la masia\b/i,
  /\bpépites de la masia\b/i,
  /\bdiarra\b/i
];

const INCLUDE_URL = [
  /\/futbol\/barcelona\//i,
  /first-team/i,
  /football\/first-team/i
];

function normalize(text) {
  return (text || '').toLowerCase();
}

function getSearchText(article) {
  return normalize([
    article.title,
    article.excerpt,
    article.rawContent,
    article.link
  ].filter(Boolean).join(' '));
}

function matchesAny(text, patterns) {
  return patterns.some(p => p.test(text));
}

function mentionsFirstTeamPlayer(text) {
  return FIRST_TEAM_PLAYERS.some(name => text.includes(name));
}

function isMercato(text) {
  return MERCATO_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function isFirstTeamContext(text, link) {
  if (matchesAny(link, INCLUDE_URL)) return true;
  if (mentionsFirstTeamPlayer(text)) return true;
  if (STAFF_KEYWORDS.some(kw => text.includes(kw))) return true;
  if (/\b(primer equipo|first team|équipe première|equipe premiere|pretemporada|pré-saison|preseason|liga\s+\d{2}[-/]\d{2})\b/i.test(text)) return true;
  if (/\b(barça|barca|barcelon|fc barcelona|blaugrana)\b/i.test(text) && isMercato(text)) return true;
  return false;
}

export function classifyArticle(article) {
  const text = getSearchText(article);
  const link = normalize(article.link);
  if (isMercato(text)) return 'mercato';
  return 'equipe';
}

export function isFirstTeamNews(article) {
  const text = getSearchText(article);
  const link = normalize(article.link);

  if (matchesAny(link, EXCLUDE_URL)) return false;
  if (matchesAny(text, EXCLUDE_TEXT)) return false;

  if (!/\b(barça|barca|barcelon|fc barcelona|blaugrana)\b/i.test(text)) {
    return false;
  }

  return isFirstTeamContext(text, link) || isMercato(text);
}

export function filterFirstTeamNews(articles) {
  return articles.filter(isFirstTeamNews);
}
