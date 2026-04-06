# ELBAR COMPANY

Application web fintech en francais pour la gestion des operations Mobile Money,
cash physique, depenses, reconciliation journaliere et supervision multi-extensions.

## Stack technique

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- React Router
- Firebase (Auth, Firestore, Storage)
- PWA de base (manifest + service worker)

## Lancer le projet

1. Installer les dependances:

```bash
npm install
```

2. Copier les variables d'environnement:

```bash
cp .env.example .env
```

3. Renseigner les cles Firebase dans `.env`.

4. Demarrer le mode developpement:

```bash
npm run dev
```

## Scripts

- `npm run dev`: lancement local
- `npm run build`: build production
- `npm run preview`: previsualiser le build
- `npm run lint`: verifier le code
- `npm run typecheck`: verifier TypeScript

## Cloud Functions (validation serveur)

Les clotures journalieres passent maintenant par des fonctions serveur pour renforcer
l'integrite des donnees et bloquer les ecritures directes client sur `dailyClosures`.

### Fonctions disponibles

- `submitDailyClosureSecure`: soumission agent (anti-duplication par jour + calcul risque serveur)
- `reviewDailyClosureSecure`: revue/verrouillage admin (transition de statut validee + audit)

### Initialisation locale

1. Installer les dependances des functions:

```bash
npm --prefix functions install
```

2. Compiler les functions:

```bash
npm --prefix functions run build
```

3. Deployer functions + firestore (rules/indexes):

```bash
firebase deploy --only functions,firestore
```

## Structure actuelle (Etape 7)

```text
src/
  app/
    router.tsx
  modules/
    admin/pages/
    agent/pages/
    auth/pages/
    common/pages/
  shared/
    config/
      env.ts
      firebase.ts
    layouts/
      AdminLayout.tsx
      AgentLayout.tsx
      AuthLayout.tsx
    pwa/
      registerServiceWorker.ts
```

## Note PWA

`vite-plugin-pwa` est actuellement en conflit de dependances avec Vite 8.
Pour ne pas bloquer le demarrage du projet, une base PWA manuelle est fournie:

- `public/manifest.webmanifest`
- `public/sw.js`

Lors d'une prochaine iteration, on pourra soit:

1. migrer vers une version de plugin compatible Vite 8,
2. ou conserver la strategie service worker manuelle en l'etendant.

# FinMon
