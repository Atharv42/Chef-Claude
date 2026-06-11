const SYSTEM_PROMPT = `You are an expert chef and culinary instructor with decades of experience in cuisines from around the world. When given a list of ingredients, suggest a single creative, delicious, and practical recipe a home cook can realistically prepare.

Respond in markdown using exactly this structure:

# [Recipe Name]
A brief, enticing one or two sentence description.

## Ingredients Used
- List only the provided ingredients that the recipe actually needs, with rough quantities.

## Instructions
1. Clear, numbered steps a home cook can follow.

## Chef's Tip
One short tip or variation (optional but encouraged).`;

export async function getRecipeFromClaude(ingredients, preferences, onChunk) {
  const ingredientList = ingredients.join(', ');
  const prefNote = preferences.length > 0
    ? ` Dietary requirements (strictly follow all of these): ${preferences.join(', ')}.`
    : '';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `I have these ingredients: ${ingredientList}. What should I make?${prefNote}` },
      ],
    }),
  });

  if (response.status === 401) {
    throw new Error('Invalid API key — check your VITE_GROQ_API_KEY in .env');
  }
  if (response.status === 429) {
    throw new Error('Rate limit reached — please wait a moment and try again.');
  }
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) — please try again.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const text = JSON.parse(data).choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}
