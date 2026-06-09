# ALIBI

**ALIBI** is a browser-based detective game where players investigate crime
scenes, question suspects, uncover contradictions, and identify the culprit.
AI-powered dialogue and deductions use Groq with each player's personal API
key.

## Personal API Key

ALIBI does not ship with a shared or hard-coded API key. Each player must use
their own Groq API key:

1. Visit [Groq Console](https://console.groq.com/keys) and sign in.
2. Open **API Keys** and select **Create API Key**.
3. Copy the key, which begins with `gsk_`.
4. Open ALIBI, select **Start Investigation**, and paste the key into the setup
   dialog.

The key is stored in your browser's `localStorage` under `groq_api_key` and is
sent directly from your browser to the Groq API when the game needs an AI
response. It is not included in this repository.

> Treat your API key like a password. Do not commit it, share it, or paste it
> into a public deployment's source code. You can remove it by clearing this
> site's browser storage.

Groq usage is subject to the limits and terms of the player's own account.

## Game Modes

- **Easy Mode:** Review statements from four suspects and identify the one
  whose story contains an impossible detail or contradiction.
- **Normal Mode:** Freely interrogate suspects, compare timelines, collect
  clues, and submit a final accusation with your reasoning.

## Run Locally

Requirements:

- Node.js 18 or newer
- A modern Chromium-based browser
- A personal Groq API key

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`.

## Technology

- HTML, CSS, and JavaScript
- Vite
- Groq API for AI-powered gameplay
- Three.js for the 3D scenes

## Deployment

The project can be deployed to Vercel or another static host. Run
`npm run build` and publish the generated `dist/` directory.

Do not add an API key to deployment environment variables intended for the
browser bundle. Every player should enter their own key through the in-app
setup dialog.

## License

MIT
