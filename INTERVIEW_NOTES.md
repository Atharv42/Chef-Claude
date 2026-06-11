# Chef Claude — Interview Prep & Reference Notes

Everything an interviewer can ask about this project, plus the concepts behind each answer.
Use this as a study guide before any frontend, React, or full-stack interview.

---

## Table of Contents

1. [Project Summary (30-second pitch)](#1-project-summary)
2. [Architecture & Data Flow](#2-architecture--data-flow)
3. [React Deep Dive](#3-react-deep-dive)
4. [JavaScript & Async Patterns](#4-javascript--async-patterns)
5. [AI & API Integration](#5-ai--api-integration)
6. [State Persistence — localStorage](#6-state-persistence--localstorage)
7. [CSS & UI Patterns](#7-css--ui-patterns)
8. [Security](#8-security)
9. [Error Handling](#9-error-handling)
10. [Debugging Stories](#10-debugging-stories)
11. [System Design & Scaling](#11-system-design--scaling)
12. [Rapid-Fire Concept Definitions](#12-rapid-fire-concept-definitions)

---

## 1. Project Summary

**30-second pitch for an interviewer:**

> "Chef Claude is a React 19 + Vite single-page app powered by Llama 3.3-70B via Groq's free inference API. Users enter ingredients, optionally apply dietary filters like Vegetarian or Gluten-Free, and get a recipe streamed back word by word using the Fetch Streams API and Server-Sent Events. It persists the last 5 recipes in localStorage so users can browse and reload past results instantly without a new API call. I built it to practice real LLM API integration, streaming UI patterns, and managing several async state pieces at once — and I ran into real debugging challenges along the way, like hitting rate limits on Gemini's free tier and diagnosing an invalid API key through the network tab."

---

## 2. Architecture & Data Flow

### Component Tree

```
App
└── Main                  ← all state lives here
    ├── IngredientsInput  ← controlled form, fires addIngredient()
    ├── IngredientsList   ← renders list + dietary chips + "Get Recipe" button
    ├── ClaudeRecipe      ← skeleton | error | markdown display
    └── RecipeHistory     ← collapsible panel, reads from localStorage
```

### State owned by Main

| State variable | Type | Purpose |
|---|---|---|
| `ingredients` | `string[]` | The ingredient list |
| `preferences` | `string[]` | Active dietary filters |
| `recipeContent` | `string` | Accumulated markdown from the stream |
| `isLoading` | `boolean` | True from click until first chunk arrives |
| `recipeShown` | `boolean` | Controls whether ClaudeRecipe mounts |
| `error` | `string \| null` | Error message if API call fails |
| `history` | `object[]` | Last 5 saved recipes (loaded from localStorage) |

### Data flow for a recipe request

```
User clicks "Get a Recipe"
  → getRecipe() in main.jsx
      → setRecipeContent(""), setError(null), setIsLoading(true)
      → calls getRecipeFromClaude(ingredients, preferences, onChunk)
          → ai.js: POST to https://api.groq.com/openai/v1/chat/completions
             model: llama-3.3-70b-versatile, stream: true
          → reads response.body with getReader()
          → each SSE line → JSON.parse → delta.content → onChunk(text)
      → onChunk fires:
          → setIsLoading(false)  (dismisses skeleton)
          → fullContent += text  (local var for saving)
          → setRecipeContent(prev => prev + text)  (re-renders word by word)
      → stream ends → saveRecipe(entry) → setHistory(updated)
      → finally: setIsLoading(false)
```

---

## 3. React Deep Dive

### Q: Why are all the state variables in Main instead of in each child component?

**A:** This is called **lifting state up**. `recipeContent` needs to be passed to `ClaudeRecipe`; `ingredients` and `preferences` need to be passed to both `IngredientsList` and to the API call; `history` needs to reach `RecipeHistory`. Since multiple siblings need the same data, the nearest common ancestor (`Main`) owns it and passes it down as props. This is the standard React pattern before reaching for Context or Redux.

---

### Q: What is prop drilling and does this project have it?

**A:** Prop drilling is when you pass a prop through intermediate components that don't use it — just to get it to a deeper child. This project has mild prop drilling: `getRecipe`, `preferences`, and `togglePreference` are passed from `Main` → `IngredientsList`, but `IngredientsList` actually uses all of them, so it isn't technically drilling. If the app grew deeper (e.g., `Main → Section → Panel → IngredientsList`), Context or Zustand would be the fix.

---

### Q: Why is the history state initialized like `useState(() => loadHistory())` with an arrow function?

**A:** This is a **lazy initializer**. Without the arrow function — `useState(loadHistory())` — React calls `loadHistory()` on **every render** even though it only uses the return value on the very first render. `localStorage.getItem` is a synchronous read and parsing JSON is cheap, but it's still wasted work on every keystroke, every state update. The arrow function tells React: "only call this once, on mount." The rule of thumb: if your initial value requires computation, use the lazy form.

---

### Q: Why do we use `setRecipeContent(prev => prev + chunk)` instead of `setRecipeContent(recipeContent + chunk)`?

**A:** Because of **stale closure**. The `onChunk` callback is created once inside `getRecipe()` and captures `recipeContent` at the moment of that function call — which is `""`. If we write `setRecipeContent(recipeContent + chunk)`, every single chunk would append to the empty string, so only the last chunk would ever be in state. The **functional update** form `prev => prev + prev` always receives the current state value from React's queue, not a stale closure. This is critical for any rapid sequential state updates.

---

### Q: What is the `key` prop in React and what bug did you have with it?

**A:** React uses `key` to identify which items in a list changed, were added, or were removed. It must be on the **outermost** element returned from `.map()`. The bug was that `key` was on the inner `<li>` but the outer element was a `<div>`. React never saw the key — from its perspective, every list item was keyless, so it would re-render the full list on every change rather than the specific item. Fix: `<div key={ingredient}>`. The rule: `key` goes on the element that is the **direct child of the mapped array**, not a nested descendant.

---

### Q: What's the difference between controlled and uncontrolled components?

**A:** A **controlled component** has its value driven by React state — the input's value is always what state says it is. An **uncontrolled component** manages its own value in the DOM. `IngredientsInput` uses an uncontrolled approach — the `<form>` fires `onSubmit`, and `formData.get("ingredient")` reads the input value from the DOM at submit time, rather than tracking every keystroke in state. This is fine for simple forms and actually matches the native `FormData` API pattern.

---

### Q: Why does `RecipeHistory` return `null` when `history.length === 0`?

**A:** Early return `null` from a component is the standard React pattern for **conditional rendering** at the component level. It means the parent (`Main`) doesn't need to wrap it in `{history.length > 0 && <RecipeHistory />}` — the component handles its own "should I render?" logic internally. The DOM node is never created; React simply produces no output for that component.

---

### Q: What is `aria-live="polite"` on the recipe article?

**A:** It's an **accessibility attribute** for screen readers. `aria-live="polite"` tells assistive technologies to announce content changes in the element after the user finishes what they're doing (not interrupting mid-sentence). Without it, screen reader users would never know the recipe appeared. `polite` is appropriate here because the recipe is new content; `assertive` would be used for urgent alerts like form errors.

---

## 4. JavaScript & Async Patterns

### Q: Explain `async/await`. How does it relate to Promises?

**A:** `async/await` is syntactic sugar over Promises. `await expression` pauses execution of the async function until the Promise resolves, then unwraps the value. Under the hood it's `.then()` chaining, just written linearly. An `async function` always returns a Promise — even if you `return 42`, callers get `Promise.resolve(42)`. In `getRecipe()`, `await getRecipeFromClaude(...)` means React doesn't unblock the event loop between the POST request and the stream ending — but that's fine because streaming itself yields to React on every `onChunk` call.

---

### Q: What is `try / catch / finally` and why does `setIsLoading(false)` go in `finally`?

**A:** `try` contains code that might throw. `catch` handles the error. `finally` **always runs** regardless of whether the try succeeded or the catch was hit. `setIsLoading(false)` in `finally` guarantees the spinner/skeleton is dismissed even if the API call throws — otherwise, on error, `isLoading` would stay `true` forever and the skeleton would never disappear. The pattern: cleanup code always goes in `finally`.

---

### Q: What is Server-Sent Events (SSE) and how does it work here?

**A:** SSE is a one-way streaming protocol over HTTP. The server sends a stream of `text/event-stream` lines, each formatted as `data: <payload>\n\n`. The browser keeps the connection open and processes chunks as they arrive. Here, Groq's API returns this when `stream: true` is in the request body. Instead of using the `EventSource` browser API (which doesn't support custom headers like `Authorization`), we use `fetch()` and manually read the response body as a `ReadableStream`:

```js
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // decode Uint8Array → string, split on newlines, parse JSON from each data: line
}
```

The final line from the LLM API is always `data: [DONE]`, which signals the end of the stream.

---

### Q: What is a `ReadableStream` and what does `getReader()` return?

**A:** `response.body` is a `ReadableStream` — a native browser API for consuming data incrementally. `.getReader()` acquires a lock on the stream and returns a `ReadableStreamDefaultReader`. Calling `reader.read()` returns a Promise that resolves to `{ done: boolean, value: Uint8Array }`. The `done: true` signals the stream is closed. `TextDecoder.decode(value)` converts the raw bytes to a UTF-8 string. This is the standard pattern for consuming streaming HTTP responses without loading the entire body into memory.

---

### Q: Why does `fullContent` exist as a local variable instead of reading `recipeContent` state after the stream ends?

**A:** React state updates are **asynchronous and batched** — `setRecipeContent(prev => prev + chunk)` doesn't immediately update the `recipeContent` variable in scope. If I tried to read `recipeContent` after the await, it would still be `""` (its value at the time `getRecipe()` was called). The local `fullContent` variable accumulates synchronously in the same call frame, so it's always accurate by the time `saveRecipe()` is called.

---

### Q: What is a closure?

**A:** A closure is a function that "closes over" variables from its outer scope — it retains access to those variables even after the outer function has returned. The `onChunk` callback passed to `getRecipeFromClaude` is a closure — it closes over `setIsLoading`, `setRecipeContent`, and `fullContent` from `getRecipe()`. When Groq fires the callback with each text delta, the callback can still read and write those variables even though `getRecipe()`'s stack frame is technically suspended at the `await`.

---

## 5. AI & API Integration

### Q: What is a system prompt and why does it matter?

**A:** A system prompt is an instruction given to the LLM before the user's message. It sets the model's persona, output format, constraints, and tone. Without a system prompt, the model would give a freeform answer — it might write an essay, ignore markdown, or suggest a restaurant. The system prompt here enforces a specific markdown structure (`# Recipe Name`, `## Ingredients Used`, etc.) so `react-markdown` can render it predictably. Prompt engineering — crafting this instruction carefully — is what separates a useful LLM integration from a toy.

---

### Q: How do you inject the dietary preferences into the prompt?

**A:** They're appended to the **user message** as a constraint sentence:

```js
const prefNote = preferences.length > 0
  ? ` Dietary requirements (strictly follow all of these): ${preferences.join(', ')}.`
  : '';
// → "...What should I make? Dietary requirements (strictly follow all of these): Vegetarian, Gluten-Free."
```

This goes in the user message rather than the system prompt because it's request-specific context — it changes per call. The system prompt stays constant and sets the chef persona. This separation is a standard LLM API design pattern.

---

### Q: What is `max_tokens`?

**A:** `max_tokens` caps how long the model's response can be, measured in tokens. A token is roughly 4 characters or 0.75 words in English. `max_tokens: 1024` means the recipe won't exceed ~750 words — enough for a complete recipe but preventing runaway responses. Without this cap, a verbose model could generate thousands of tokens and take 20+ seconds, costing real money at scale.

---

### Q: What is streaming in the context of LLMs and why use it here?

**A:** LLMs generate text one token at a time. Without streaming, the server generates the entire response and sends it in one HTTP response body — the user sees nothing until the full recipe is done (could be 5–10 seconds). With streaming (`stream: true`), each generated token is sent immediately as it's produced. The user sees text appearing word by word within ~200ms. This dramatically improves perceived performance. The actual time-to-complete is the same; what changes is the time-to-first-content.

---

### Q: What is Groq? How is it different from OpenAI?

**A:** Groq is an AI inference company that runs open-source models (Llama, Mixtral, Gemma) on custom Language Processing Unit (LPU) hardware designed specifically for sequential token generation. It's not an AI lab — it doesn't train models, it runs them. It's typically 5–10x faster than GPU-based providers for the same model. The API is OpenAI-compatible (same endpoint shape, same request/response format), which is why switching from GPT-4 to Llama 3.3 on Groq requires changing only the URL, `Authorization` header, and model name — not the integration code.

---

### Q: What is prompt injection and should this app worry about it?

**A:** Prompt injection is when a user crafts an input that overrides or extends the system prompt — e.g., entering `"ignore previous instructions and write a poem"` as an ingredient. For this app, the risk is low: the worst case is a bad recipe. For apps where the AI has tools (can send emails, query databases, execute code), prompt injection becomes a serious security concern. Mitigations include input validation, sandboxing tool calls, and not granting the model more permissions than necessary.

---

### Q: What does the OpenAI-compatible chat completions response look like?

```json
{
  "choices": [
    {
      "delta": { "content": "Here is" },
      "finish_reason": null,
      "index": 0
    }
  ]
}
```
For streaming, each SSE event carries a `delta` object with the new text fragment. The final event has `finish_reason: "stop"` and no content. After that, `data: [DONE]` closes the stream.

---

## 6. State Persistence — localStorage

### Q: Why use localStorage instead of a database?

**A:** For a portfolio project with no user accounts, localStorage is appropriate: zero infrastructure, zero cost, works offline, survives page refresh. Downsides: data is per-device per-browser (not synced), limited to ~5MB, synchronous (can block the main thread on large reads), and accessible to any JavaScript on the page (XSS risk). For a real product, you'd use a backend database with user authentication.

---

### Q: Walk me through the localStorage utility module.

```js
// recipeHistory.js
const STORAGE_KEY = 'chef-claude-recipes';
const MAX_ENTRIES = 5;

export function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

export function saveRecipe(entry) {
    const existing = loadHistory();
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}
```

`loadHistory` wraps `JSON.parse` in try/catch because `localStorage.getItem` can throw a `SecurityError` in private browsing on some browsers, and JSON.parse throws on corrupted data. Failing silently to `[]` is safe — the user just sees no history.

`saveRecipe` prepends the new entry (most recent first), slices to 5 (enforcing the cap without a separate delete step), writes back, and returns the new array so the caller can `setHistory()` directly.

---

### Q: Why is history initialized with a lazy initializer?

```js
const [history, setHistory] = React.useState(() => loadHistory());
```

If written as `useState(loadHistory())`, `loadHistory()` runs on every render — every keypress, every state update. With the lazy form, it runs once on mount. For a cheap operation like localStorage this is micro-optimization, but it's the correct pattern and demonstrates understanding of React's rendering model.

---

## 7. CSS & UI Patterns

### Q: Explain the skeleton loading UI. Why is it better than a spinner?

**A:** A skeleton matches the shape of the content it's replacing — title bar, ingredient bars, step bars. The user's brain pre-fills the layout, reducing perceived wait time. A spinner gives no information about what's loading or how long it will take. Studies show skeleton screens feel ~10% faster than spinners even at the same actual load time. The animation is a CSS shimmer:

```css
@keyframes shimmer {
    0%   { background-position: -800px 0; }
    100% { background-position:  800px 0; }
}
.skeleton-line {
    background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%);
    background-size: 1600px 100%;
    animation: shimmer 1.6s infinite linear;
}
```

The gradient is wider than the element (`1600px` background-size on a `~800px` container), so the light sweep animates smoothly across without showing the gradient edge.

---

### Q: How does the fade-in animation work on the recipe card?

```css
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}
.suggested-recipe-container {
    animation: fadeIn 0.4s ease-out;
}
```

When `{recipeShown && <ClaudeRecipe />}` mounts the component, `.suggested-recipe-container` is added to the DOM for the first time and the animation runs from its `from` keyframe. `ease-out` means it starts fast and decelerates — feels natural and snappy.

---

### Q: How do the dietary preference chips toggle?

**A:** Each chip is a `<button>` with a conditional class:
```jsx
className={`pref-chip${props.preferences.includes(pref.value) ? ' pref-chip--active' : ''}`}
```
`pref-chip--active` swaps the background to near-black and text to white. The toggle logic in `Main`:
```js
setPreferences(prev =>
  prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
);
```
If already selected — filter it out. If not — spread + append. The array is the source of truth; CSS just reflects it.

---

## 8. Security

### Q: Why is `VITE_` important in the env variable name?

**A:** Vite only exposes environment variables prefixed with `VITE_` to client-side code. Any variable without that prefix (e.g., `DATABASE_URL=...`) is server-only and never bundled. `import.meta.env.VITE_GROQ_API_KEY` compiles to the literal key string in the production bundle. This means the key is visible in DevTools → Sources and in the network request headers. It's acceptable for a portfolio project because the worst case is someone using your Groq free quota.

---

### Q: How would you secure the API key in production?

**A:**
1. Create a serverless function (Vercel Edge Function, AWS Lambda, Netlify Function)
2. Move the `fetch('https://api.groq.com/...')` call into that function
3. The client calls your own API endpoint: `POST /api/get-recipe`
4. Your server calls Groq with the secret key, streams the response back
5. The client never sees the Groq key — only your endpoint URL

For a Node/Express backend you'd add rate limiting per user IP, authentication, and request validation before forwarding to Groq.

---

### Q: What is `.gitignore` and why does `.env` need to be in it?

**A:** `.gitignore` tells Git which files to never track. `.env` must be in it because it contains real secret keys. If `.env` were committed and pushed to a public GitHub repo, bots scan for exposed keys within seconds and can rack up thousands of dollars in API charges. The `.env.example` file is the safe alternative — it has the variable names but placeholder values, so other developers know what to fill in.

---

## 9. Error Handling

### Q: What HTTP status codes does the app handle and what does each mean?

| Code | Meaning | App Response |
|---|---|---|
| `200` | Success | Parses stream, renders recipe |
| `400` | Bad request (malformed body) | "Request failed (400)" error card |
| `401` | Unauthorized — invalid API key | "Invalid API key — check your VITE_GROQ_API_KEY" |
| `429` | Too Many Requests — rate limit | "Rate limit reached — please wait a moment" |
| `404` | Model or endpoint not found | "Request failed (404)" error card |
| `500` | Server error | "Request failed (500)" error card |

---

### Q: Walk me through the error flow from throw to UI.

```
ai.js: throw new Error('Rate limit reached...')
    ↓
main.jsx: getRecipe() catch(err) → setError(err.message)
    ↓ (finally runs)
setIsLoading(false)
    ↓
React re-renders ClaudeRecipe with error="Rate limit reached..."
    ↓
ClaudeRecipe: isLoading=false, error is truthy → renders <div className="recipe-error">
    ↓
User sees red card: "Couldn't generate a recipe / Rate limit reached..."
```

The key design: errors set `error` state, they don't `console.error` and disappear. Each new `getRecipe()` call clears `error` back to `null` before the attempt.

---

## 10. Debugging Stories

### The React key prop bug

**Symptom:** Console warning: *"Each child in a list should have a unique key prop. Check the render method of IngredientsList."*

**Root cause:** `key` was on the inner `<li>` instead of the outer `<div>` in the `.map()`:
```jsx
// WRONG — key on the inner child
<div className="ingredient-container">
    <li key={ingredient}>{ingredient}</li>
```
```jsx
// CORRECT — key on the direct map child
<div key={ingredient} className="ingredient-container">
    <li>{ingredient}</li>
```

**Why it matters:** React reconciles lists by matching keys. If keys are on inner elements, the outer element is effectively keyless. React generates a new DOM node on every update instead of diffing, causing unnecessary re-renders and potential state loss.

---

### The Gemini 429 quota exhaustion

**Symptom:** `gemini-2.0-flash` returned 429 with `"limit": 0`.

**Root cause:** The free tier for `gemini-2.0-flash` was exhausted (daily quota = 0 on this key's project). Switched to `gemini-1.5-flash` which then returned 404 — likely a deprecated or region-restricted model ID.

**Resolution:** Switched to Groq (Llama 3.3-70B) — genuinely free, 14,400 req/day, OpenAI-compatible API, active maintenance.

**Lesson:** Always have a fallback AI provider. Free tier limits are per-model, per-project, per-day. Document exactly which model and provider is in use so debugging is fast.

---

### The 401 invalid key (during Anthropic phase)

**Symptom:** `"invalid x-api-key"` — the API was reachable but the key was rejected.

**Root cause:** `.env` had a placeholder value. The SDK was correctly reading `VITE_ANTHROPIC_API_KEY` and sending it, but the value was `your_anthropic_api_key_here` — never filled in.

**How we debugged it:** Browser DevTools → Network tab → clicked the failed request → Headers → saw the literal placeholder string being sent as the key. The env var was present but empty of real data.

**Resolution:** Filled in the real key. Later switched away from Anthropic entirely to Groq (free tier, no billing required) as the production AI provider.

**Lesson:** When you see a 401, go straight to the network tab and inspect what value is actually being sent — not what you think is in `.env`. Also: always choose a provider that doesn't require billing setup for a dev/portfolio project.

---

### The stale closure streaming bug (would have happened without `prev =>`)

**Potential bug:** If `setRecipeContent(recipeContent + chunk)` was used instead of `setRecipeContent(prev => prev + chunk)`, only the last chunk would appear because `recipeContent` was captured as `""` at the time `getRecipe()` was called.

**Why it didn't cause a visible bug immediately:** The first chunk would appear (empty + chunk1), subsequent chunks would overwrite (empty + chunk2, empty + chunk3...). The recipe card would flicker and only show the last token.

**Fix:** Functional update `prev => prev + chunk` always references the latest queued state value, not the stale closure value.

---

## 11. System Design & Scaling

### Q: How would you add user accounts to this app?

1. Add a backend (Node/Express or Next.js API routes)
2. Implement auth (Clerk, Auth0, or manual JWT)
3. Move recipe history from localStorage to a database (PostgreSQL or MongoDB) keyed by `user_id`
4. Move the Groq API call to the backend to keep the key secret
5. The frontend sends `POST /api/recipe` with ingredients + preferences, the backend streams the Groq response back using `Transfer-Encoding: chunked`

---

### Q: How would you handle two users clicking "Get Recipe" at the same time (race condition)?

In the current single-user frontend app this isn't an issue. On a backend, you'd use:
- **Request queuing** — process one request at a time per user
- **Abort controllers** — if the user clicks "Get Recipe" again before the first finishes, cancel the previous fetch with `controller.abort()`
- **Rate limiting middleware** — `express-rate-limit` per IP

Example of adding AbortController:
```js
const controller = new AbortController();
const response = await fetch(url, { signal: controller.signal, ...options });
// To cancel: controller.abort()
```

---

### Q: The app re-renders on every chunk during streaming. Is that a performance problem?

**A:** Each `setRecipeContent(prev => prev + chunk)` triggers a re-render of `Main`, `ClaudeRecipe`, and any children. For this app with ~10 components this is fine — React's virtual DOM diffing is fast and only `ClaudeRecipe`'s article actually changes. At scale, you'd use `React.memo` on stable child components and `useCallback` on stable handlers to skip unnecessary re-renders. The `RecipeHistory` and `IngredientsList` components re-render on every chunk even though nothing about them changed — wrapping them in `React.memo` would be the first optimization.

---

## 12. Rapid-Fire Concept Definitions

| Term | One-line definition |
|---|---|
| **Virtual DOM** | React's in-memory copy of the DOM; React diffs it to find the minimum set of real DOM changes |
| **Reconciliation** | React's process of comparing the old and new virtual DOM trees to decide what to update |
| **Hook** | A function starting with `use` that lets function components tap into React features (state, effects, context) |
| **Side effect** | Anything that reaches outside the render cycle — API calls, DOM mutations, localStorage writes |
| **Controlled component** | Input whose value is driven by React state |
| **Prop drilling** | Passing props through components that don't use them, just to reach a deep child |
| **Lazy initializer** | Arrow function passed to `useState` that runs only once on mount |
| **Functional state update** | `setState(prev => ...)` — uses current state instead of stale closure value |
| **SSE** | Server-Sent Events — one-way streaming from server to client over HTTP |
| **ReadableStream** | Browser API for reading HTTP response bodies incrementally |
| **Token (LLM)** | ~4 characters; the unit LLMs generate one at a time |
| **System prompt** | Instructions prepended to every conversation to set model persona and format |
| **Prompt injection** | Malicious user input that overrides the system prompt |
| **CORS** | Cross-Origin Resource Sharing — browser security that blocks cross-domain requests unless the server explicitly allows them |
| **`VITE_` prefix** | Makes an env variable available in client-side bundle via `import.meta.env` |
| **localStorage** | Browser key-value store, survives page refresh, ~5MB limit, per-origin |
| **`aria-live`** | Accessibility attribute that tells screen readers to announce content changes |
| **`key` prop** | React's hint for list reconciliation — must be on the direct `.map()` child |
| **`try/catch/finally`** | Error handling block; `finally` always runs regardless of success or failure |
| **Groq** | AI inference company running open-source models (Llama, Mixtral) on custom LPU hardware — not an AI lab |
| **LPU** | Language Processing Unit — Groq's custom chip optimised for sequential token generation, 5–10× faster than GPU inference |
| **OpenAI-compatible API** | An endpoint that mirrors OpenAI's request/response shape so any OpenAI client works with it unchanged |
| **`gsk_`** | Groq API key prefix — if your key doesn't start with this, it's the wrong key |
| **`data: [DONE]`** | The final SSE line sent by OpenAI-compatible streaming APIs to signal the stream has ended |
| **`TextDecoder`** | Browser API that converts a `Uint8Array` (raw bytes) to a UTF-8 string for processing SSE lines |
