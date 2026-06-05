# Portal Blaugrana — FC Barcelone

Site web statique regroupant les informations du FC Barcelone, avec **mise à jour automatique des actualités** via GitHub Actions.

## Fonctionnalités

- **Actualités automatiques** — Agrégation RSS toutes les 6 heures (site officiel, Google News, Marca…)
- **Effectif** — Joueurs de l'équipe première avec filtres par poste
- **Le Club** — Informations institutionnelles
- **Histoire** — Frise chronologique des moments clés
- **Palmarès** — Trophées majeurs du club
- **Design responsive** — Couleurs blaugrana, interface moderne

## Déploiement sur GitHub Pages

### 1. Créer le dépôt GitHub

```bash
cd fc-barcelona-site
git init
git add .
git commit -m "feat: site Portal Blaugrana FC Barcelone"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/fc-barcelona-site.git
git push -u origin main
```

### 2. Activer GitHub Pages

1. Allez dans **Settings → Pages**
2. Source : **GitHub Actions**
3. Le workflow `deploy-pages.yml` déploiera automatiquement le site

### 3. Activer les mises à jour automatiques

Le workflow `update-news.yml` s'exécute :
- Toutes les **6 heures** (cron)
- À chaque push sur `main`
- Manuellement via **Actions → Mettre à jour les actualités → Run workflow**

## Administration (édition sans code)

Le site inclut un panneau d'administration accessible via un **lien secret** :

```
https://votre-site.github.io/admin.html?key=VOTRE_CLE
```

### Configuration

1. **Changez la clé d'accès** dans `js/admin/config.js` (variable `ADMIN_KEY`)
2. **Ne partagez jamais** ce lien publiquement
3. Dans l'onglet **Paramètres**, connectez votre dépôt GitHub :
   - Utilisateur et nom du dépôt
   - Token GitHub (Fine-grained PAT avec permission **Contents: Read and write**)
4. Modifiez l'effectif, les actualités ou le club, puis cliquez **Publier en ligne**

### Compatible GitHub Pages ?

**Oui.** GitHub Pages sert des fichiers statiques, mais l'admin pousse les modifications directement sur GitHub via l'API. Le workflow de déploiement se relance automatiquement et le site est à jour en 1-2 minutes.

Sans configuration GitHub, vous pouvez **Exporter JSON** et committer manuellement.

## Développement local

```bash
npm install
npm run fetch-news    # Récupérer les actualités
npm run fetch-photos  # Photos joueurs
npx serve .           # Servir le site localement
```

Ouvrez `http://localhost:3000` — Admin : `http://localhost:3000/admin.html?key=blaugrana-edit-2026`

## Structure du projet

```
fc-barcelona-site/
├── index.html              # Accueil
├── actualites.html         # Actualités
├── effectif.html           # Effectif
├── joueur.html             # Fiche joueur
├── article.html            # Fiche article
├── admin.html              # Panneau d'administration
├── css/
├── js/
│   ├── admin/              # Logique admin + sync GitHub
│   └── ...
├── data/
│   ├── news.json
│   ├── team.json
│   └── club.json
├── scripts/
└── .github/workflows/
```

## Sources RSS

| Source | Catégorie |
|--------|-----------|
| FC Barcelona (officiel) | Officiel |
| Google News | International |
| Google News Mercato | Presse |
| Marca | Presse |

## Limitations

- **Site statique** : pas de serveur backend — les actualités RSS sont mises à jour via GitHub Actions ; l'édition manuelle passe par l'admin ou les fichiers JSON.
- **Flux RSS** : certains sites peuvent bloquer leurs flux.
- **Admin** : la clé secrète n'est pas un chiffrement — changez-la et gardez le lien privé.
- **Non affilié** : site informatif non officiel.

## Licence

Projet éducatif — Données publiques et flux RSS.
