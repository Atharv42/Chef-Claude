# Chef Claude — Next Steps & Upgrade Roadmap

Potential improvements grouped by category and effort level.
Each item includes what to build, why it matters, and how hard it is.

**Effort scale:** 🟢 Easy (< 2 hrs) · 🟡 Medium (half day) · 🔴 Hard (1–3 days)

---

## 1. UX & UI Improvements

### 🟢 Copy Recipe to Clipboard
Add a "Copy" button inside the recipe card that copies the full markdown text.
```js
navigator.clipboard.writeText(recipeContent);
```
Why: Users want to save recipes to Notes, WhatsApp, or email. One button fixes the friction.

---

### 🟢 "Clear All" Button for Ingredients
A single button to reset the ingredient list when starting fresh.
Why: Currently users have to click the red X on every item one by one. Annoying on mobile.

---

### 🟢 Disable "Get a Recipe" Button While Loading
Set `disabled={isLoading}` on the button and add a spinner icon inside it.
Why: Double-clicking while streaming fires a second API request. The button should communicate its state visually.

---

### 🟢 Character Count / Duplicate Guard on Ingredient Input
Before pushing to the `ingredients` array, check:
```js
if (!newIngredient.trim() || ingredients.includes(newIngredient.trim())) return;
```
Why: Prevents blank entries and accidental duplicates like "egg" + "egg" confusing the AI.

---

### 🟡 Dark Mode Toggle
Add a `theme` state (`"light"` / `"dark"`), toggle a `data-theme` attribute on `<body>`, and define CSS custom properties for both themes in `index.css`.
Why: Most developer-facing apps have dark mode. Shows CSS variable knowledge in an interview.

---

### 🟡 Mobile Responsiveness Audit
The current layout isn't tested on small screens. The `.recipe-generator` flex row breaks on narrow viewports.
Add media queries for `max-width: 600px` — stack the button below the text, reduce padding, make chips wrap better.
Why: A portfolio project that breaks on mobile is a red flag.

---

### 🟡 Serving Size Adjuster
Add a number input (default: 2) above the "Get a Recipe" button. Append it to the user message:
```
"...What should I make? Make it for 4 people."
```
Why: Demonstrates dynamic prompt construction and shows real product thinking.

---

### 🟡 Print / Save as PDF Button
Use the browser's `window.print()` with a `@media print` CSS block that hides the input area and only shows the recipe card.
Why: Users actually want printed recipes on the counter. Zero external dependency.

---

### 🔴 Ingredient Autocomplete
As the user types, show suggestions pulled from a static list of ~200 common ingredients.
Use a `<datalist>` element (native HTML, zero JS) or a custom dropdown.
Why: Reduces friction significantly — users often aren't sure how to spell "worcestershire" or "coriander."

---

## 2. AI & Prompt Improvements

### 🟢 Cuisine Type Filter
Add a second row of chips for cuisine: Italian, Indian, Mexican, Japanese, Mediterranean.
Inject into the user message: `"...Cuisine preference: Indian."`
Why: Tiny code change, big UX improvement — same toggle chip pattern already built.

---

### 🟢 Difficulty Level Selector
Add a dropdown or chip row: Easy / Medium / Hard.
Append to prompt: `"Make it suitable for a beginner cook."`
Why: Personalises the recipe quality to the user's skill without any AI changes.

---

### 🟡 "Surprise Me" Mode
Skip the dietary chips and generate a random-style recipe by adding to the system prompt:
`"Be creative and surprising — pick an unexpected but delicious combination."`
Why: Adds replayability. A button next to "Get a Recipe" that passes a `surpriseMode` flag.

---

### 🟡 Recipe Refinement (Follow-up Prompt)
After a recipe is shown, add a text input: "Ask Chef Claude to modify this recipe…"
Send the previous recipe as assistant context and the user's modification request as a follow-up message.
This uses the multi-turn conversation format the Groq API already supports:
```js
messages: [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: 'I have these ingredients...' },
  { role: 'assistant', content: previousRecipe },
  { role: 'user', content: 'Make it spicier and add less butter' },
]
```
Why: Multi-turn is the biggest jump from "I called an API" to "I built a real AI feature."

---

### 🟡 Model Selector Dropdown
Let users choose between available Groq models:
- `llama-3.3-70b-versatile` (current — best quality)
- `llama-3.1-8b-instant` (fastest, lowest latency)
- `gemma2-9b-it` (Google's model — different style)

Why: Demonstrates understanding of model tradeoffs. Impressive in interviews.

---

### 🔴 Nutritional Estimate
After the recipe generates, make a second API call to estimate calories, protein, carbs, fat using the ingredients list.
Either prompt the same LLM ("Now estimate the nutrition per serving") or use a free nutrition API like Open Food Facts.
Why: High-value feature for health-conscious users. Also demonstrates parallel API calls.

---

## 3. Data & Persistence

### 🟢 Increase History from 5 to 10
Change `MAX_ENTRIES = 10` in `recipeHistory.js`.
Why: 5 fills up quickly. 10 is more useful without meaningful storage cost (recipes are ~1–2KB each).

---

### 🟢 Delete Individual History Entries
Add a small "×" button on each history item that calls a `deleteRecipe(id)` function — filter the entry out and write back to localStorage.
Why: Users should be able to clear mistakes or unwanted recipes.

---

### 🟡 Search / Filter History
Add a text input above the history list that filters entries by recipe title or ingredient name using `.filter()` on the history array.
Why: Once history grows, browsing becomes tedious. Client-side search is fast and easy.

---

### 🟡 Export History as JSON
A single "Export" button that creates a Blob from the history array and triggers a download:
```js
const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
```
Why: Users can back up their favourite recipes. Shows Blob API knowledge.

---

### 🔴 Switch localStorage to IndexedDB
`localStorage` is synchronous and limited to ~5MB. IndexedDB is async and can store much more. Use the `idb` library (tiny wrapper) for a clean API.
Why: Demonstrates awareness of browser storage tradeoffs. Required if storing images or large recipe collections.

---

## 4. Security & Backend

### 🔴 Move API Call to a Serverless Function
Create a `/api/recipe` endpoint (Vercel Edge Function or Netlify Function) that:
1. Receives `{ ingredients, preferences }` from the frontend
2. Calls Groq with the secret key on the server
3. Streams the response back to the browser

The frontend `VITE_GROQ_API_KEY` is deleted entirely — the key never touches the client.
Why: This is the single most important production upgrade. Required for any real deployment.

---

### 🟡 Rate Limiting Per Session
Track request count in `sessionStorage`. If the user makes more than 10 requests in a session, show a "You've used 10 recipes today — come back tomorrow!" message client-side.
Why: Protects your free tier quota from accidental hammering. No backend required.

---

### 🟡 AbortController for In-Flight Requests
Store a ref to the current `AbortController`. When "Get a Recipe" is clicked while a stream is already running, abort the previous request first:
```js
const controllerRef = React.useRef(null);
// in getRecipe():
if (controllerRef.current) controllerRef.current.abort();
controllerRef.current = new AbortController();
```
Why: Prevents race conditions. Two streams writing to `recipeContent` at the same time produces garbled output.

---

## 5. Code Quality & Architecture

### 🟢 Rename `getRecipeFromClaude` → `generateRecipe`
The function is called via Groq/Llama now. The legacy name is confusing.
Why: Code should reflect reality. A 30-second rename.

---

### 🟡 Custom Hook: `useRecipeGenerator`
Extract all the async logic from `Main` into a custom hook:
```js
// hooks/useRecipeGenerator.js
export function useRecipeGenerator(ingredients, preferences) {
  const [recipeContent, setRecipeContent] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  // ... getRecipe logic
  return { recipeContent, isLoading, error, getRecipe };
}
```
`Main` becomes much cleaner — it just calls the hook and passes results to children.
Why: Custom hooks are the React pattern for reusable stateful logic. A common interview topic.

---

### 🟡 `React.memo` on Stable Components
Wrap `IngredientsList`, `RecipeHistory`, and `IngredientsInput` in `React.memo`.
During streaming, these components re-render on every chunk even though their props haven't changed.
```js
export default React.memo(function IngredientsList(props) { ... });
```
Why: Eliminates ~30 wasted re-renders per second during streaming. Demonstrates performance awareness.

---

### 🟡 Migrate to TypeScript
Rename files from `.jsx` / `.js` to `.tsx` / `.ts`, install `typescript`, and define prop types with interfaces:
```ts
interface ClaudeRecipeProps {
  recipeContent: string;
  isLoading: boolean;
  error: string | null;
}
```
Why: TypeScript is expected in most professional React codebases. A strong portfolio signal.

---

### 🔴 Add Unit Tests with Vitest + React Testing Library
Test the critical paths:
- `recipeHistory.js` — `saveRecipe` caps at 5, `loadHistory` handles corrupt JSON
- `IngredientsList` — chips toggle correctly, button hidden below 4 ingredients
- `ClaudeRecipe` — renders skeleton when loading, error card on error, markdown on success

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```
Why: Untested portfolio projects are common. A project with tests stands out.

---

## 6. Deployment

### 🟢 Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Set `VITE_GROQ_API_KEY` as an environment variable in the Vercel dashboard.
Why: A live URL on your portfolio/resume is worth 10x a GitHub link. Takes 5 minutes.

---

### 🟡 Add a Favicon and Meta Tags
Replace the default Vite favicon. Add Open Graph meta tags to `index.html` for social sharing previews:
```html
<meta property="og:title" content="Chef Claude — AI Recipe Generator" />
<meta property="og:description" content="Enter your ingredients and get a recipe instantly." />
```
Why: When you share the URL, the preview card looks professional instead of blank.

---

### 🟡 PWA Support (Installable App)
Add a `manifest.json` and a basic service worker via `vite-plugin-pwa`.
Users can "Add to Home Screen" on mobile and use it like a native app.
Why: Impressive demo feature. Shows web platform awareness.

---

## Priority Order (If You Pick One)

| Priority | Item | Why first |
|---|---|---|
| 1 | Rename `getRecipeFromClaude` | Smallest fix, biggest accuracy gain |
| 2 | Disable button while loading | Prevents double-requests, 2 lines of code |
| 3 | Deploy to Vercel | Live URL is the highest ROI portfolio move |
| 4 | Dark mode | High visual impact, common interview topic |
| 5 | Recipe refinement (multi-turn) | Biggest jump in AI feature sophistication |
| 6 | Move API call to serverless function | Required before sharing publicly |
| 7 | TypeScript migration | Most impactful for job applications |
| 8 | Unit tests | Differentiates from most portfolio projects |
