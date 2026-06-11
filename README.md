# Chef Claude

An AI-powered recipe generator built with React 19 and Vite, powered by **Llama 3.3-70B via Groq**. Add the ingredients you have on hand, apply optional dietary filters (Vegetarian, Vegan, Gluten-Free, High Protein, Quick), and get a complete recipe suggestion streamed back word by word — free, fast, and no credit card required.

---

## Features

- **AI Recipe Generation** — Sends a structured prompt to Llama 3.3 (via Groq) and streams the response back in real time
- **Streaming Output** — Text appears word by word as the model generates it, using the Fetch Streams API and Server-Sent Events (SSE)
- **Dietary Preference Chips** — Toggle filters (Vegetarian, Vegan, Gluten-Free, High Protein, Quick) that are injected directly into the AI prompt
- **Skeleton Loading UI** — Animated placeholder bars appear while the first token is in flight, replacing the "Fetching…" plain text anti-pattern
- **Recipe History** — Last 5 recipes are persisted in `localStorage` with timestamps and ingredient lists; clicking any entry reloads it instantly with no API call
- **Error Handling** — 401, 429, and generic failures each surface a human-readable message in a styled error card instead of silently failing
- **Fade-in Animation** — Recipe card animates in with a subtle `translateY` + `opacity` transition on first render

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI Framework | React 19 | Functional components, hooks, modern JSX |
| Build Tool | Vite | Fast HMR, native ES modules, `import.meta.env` |
| AI Backend | Groq (Llama 3.3-70B) | Generous free tier, OpenAI-compatible API, streaming |
| Markdown Rendering | react-markdown | Renders `#`, `##`, `- `, `1.` from the AI response |
| Persistence | localStorage | Zero-dependency client-side history, survives page refresh |
| Styling | Plain CSS | Custom properties, keyframe animations, no framework needed |

---

## Project Structure

```
Chef-Claude/
├── Components/
│   ├── ai.js               # All AI logic — Groq fetch + SSE stream parsing
│   ├── recipeHistory.js    # localStorage read/write utility (no React)
│   ├── main.jsx            # Root state: ingredients, loading, error, history
│   ├── header.jsx          # Static app header
│   ├── IngredientsInput.jsx  # Controlled form — adds ingredient on submit
│   ├── IngredientsList.jsx   # List + dietary preference chips + Get Recipe button
│   ├── ClaudeRecipe.jsx    # Skeleton / error / markdown display
│   └── RecipeHistory.jsx   # Collapsible previous-recipes panel
├── app.jsx                 # Mounts <Header /> and <Main />
├── index.jsx               # React root — createRoot + render
├── index.css               # All styles including animations and skeleton
├── .env                    # Secret keys — gitignored, never commit
├── .env.example            # Template showing required variable names
└── package.json
```

---

## Setup

### 1. Get a free Groq API key

Sign up at [console.groq.com](https://console.groq.com) → API Keys → Create API key.  
No credit card required. Free tier: **14,400 requests/day**.  
Your key will start with `gsk_`.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your key:

```
VITE_GROQ_API_KEY=gsk_your_key_here
```

> **`.env` is gitignored and must never be committed.** It contains your secret key.  
> `.env.example` is safe to commit — it shows collaborators which variables are needed.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## How It Works

1. User types an ingredient and submits → `addIngredient()` appends it to the `ingredients` state array
2. Once 4+ ingredients are added, dietary preference chips and the "Get a Recipe" button appear
3. User optionally toggles preferences (each toggles an entry in the `preferences` array)
4. Clicking "Get a Recipe" calls `getRecipeFromClaude()` in `ai.js` (the function name is a legacy internal name; the actual provider is Groq)
5. `ai.js` sends a `POST` to `https://api.groq.com/openai/v1/chat/completions` with `model: llama-3.3-70b-versatile` and `stream: true`
6. The response body is read chunk by chunk via `response.body.getReader()`
7. Each chunk is decoded, split on `\n`, and lines starting with `data: ` are JSON-parsed for `choices[0].delta.content`
8. Each text delta fires the `onChunk` callback → `setRecipeContent(prev => prev + chunk)` updates state
9. On first chunk, `setIsLoading(false)` dismisses the skeleton and the recipe starts rendering
10. When the stream ends (`[DONE]`), the full `fullContent` string is saved to `localStorage` via `saveRecipe()`
11. `RecipeHistory` re-renders with the updated history array; clicking any entry calls `onSelectHistoryEntry()` which sets `recipeContent` directly — no API call

---

## Security Note

`VITE_` prefixed variables are intentionally bundled into the client-side JavaScript by Vite — the API key is visible in the browser's network tab. This is acceptable for a learning/portfolio project.

**For production:** API calls should be proxied through a backend (Node/Express or a serverless function like Vercel Edge Functions or AWS Lambda) so the key never leaves the server.

