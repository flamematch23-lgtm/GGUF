# GGUF

Progetto Vite + React con proxy locale per usare una chiave API tramite variabili d'ambiente senza esporla nel frontend.

## Setup in VS Code

Apri il terminale integrato nella cartella del progetto ed esegui:

```bash
npm install
```

Crea o aggiorna il file `.env` nella root del progetto:

```env
WORMGPT_API_KEY=wgpt_your_api_key_here
```

Il file `.env` è escluso dal versionamento tramite `.gitignore`.

## Avvio locale

Per avviare frontend e proxy insieme da VS Code:

```bash
npm run dev:full
```

Questo comando avvia:

- `npm run api` su `http://localhost:3001`
- `npm run dev` con Vite su `http://localhost:5173`

Il frontend parla solo con endpoint locali `/api/*`, mentre il proxy server-side legge `WORMGPT_API_KEY` dal file `.env`.

## Endpoint locali disponibili

- `GET /api/health`
- `GET /api/models`
- `GET /api/usage`
- `POST /api/chat`

## Sicurezza

- Non inserire mai la chiave API nel codice React o in `import.meta.env` se l'app gira nel browser.
- Non fare commit del file `.env`.
- Se una chiave è stata incollata in chat, commit o screenshot, conviene ruotarla subito.

## Script utili

```bash
npm run api
npm run dev
npm run dev:full
npm run build
```

## Verifica rapida

Quando apri l'app nel browser dovresti vedere:

- stato del proxy
- conferma che la chiave esiste nel backend locale
- elenco modelli disponibili
- utilizzo token
- form per inviare una richiesta di test
