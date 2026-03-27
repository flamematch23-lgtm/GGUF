# GGUF

Progetto Vite + React con backend Express che esegue modelli GGUF in locale tramite [node-llama-cpp](https://github.com/withcatai/node-llama-cpp).

## Setup in VS Code

Apri il terminale integrato nella cartella del progetto ed esegui:

```bash
npm install
```

Crea o aggiorna il file `.env` nella root del progetto:

```env
MODEL_PATH=/path/to/your/model.gguf
```

Il file `.env` è escluso dal versionamento tramite `.gitignore`.

> **Nota:** Scarica un modello in formato GGUF (es. Llama 3, Mistral, Phi-3) e imposta il percorso in `MODEL_PATH`.

## Avvio locale

Per avviare frontend e backend insieme da VS Code:

```bash
npm run dev:full
```

Questo comando avvia:

- `npm run api` su `http://localhost:3001`
- `npm run dev` con Vite su `http://localhost:5173`

Il frontend parla solo con endpoint locali `/api/*`, mentre il backend carica il modello GGUF dal percorso indicato in `MODEL_PATH`.

## Endpoint locali disponibili

- `GET /api/health` — stato del server e del modello caricato
- `GET /api/models` — lista dei modelli disponibili
- `GET /api/usage` — utilizzo token
- `POST /api/chat` — invia un messaggio e ricevi una risposta dal modello

## Script utili

```bash
npm run api
npm run dev
npm run dev:full
npm run build
```

## Verifica rapida

Quando apri l'app nel browser dovresti vedere:

- stato del backend (Online/Offline)
- elenco dei modelli caricati
- form per inviare messaggi al modello GGUF locale
