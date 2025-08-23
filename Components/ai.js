// import Anthropic from "@anthropic-ai/sdk";
// import { HfInference } from "@huggingface/inference";

// const SYSTEM_PROMPT = `
// You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page
// `;

// const ANTHROPIC_MODEL = import.meta.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
// const HF_MODEL = import.meta.env.HF_MODEL || "mistralai/Mixtral-8x7B-Instruct-v0.1";

// const anthropic = new Anthropic({
//     apiKey: import.meta.env.ANTHROPIC_API_KEY, // Ensure this is server-side
//     dangerouslyAllowBrowser: true
// });

// const hf = new HfInference(import.meta.env.VITE_HF_ACCESS_TOKEN);

// export async function getRecipeFromChefClaude(ingredientsArr) {
//     if (!Array.isArray(ingredientsArr) || ingredientsArr.length === 0) {
//         throw new Error("Ingredients must be a non-empty array.");
//     }
//     const ingredientsString = ingredientsArr.map(String).join(", ");
//     try {
//         const msg = await anthropic.messages.create({
//   model: ANTHROPIC_MODEL,
//   max_tokens: 1024,
//   system: SYSTEM_PROMPT,
//   messages: [
//     { role: "user", content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!` }
//   ],
// });
//         return msg.content[0].text;
//     } catch (err) {
//         console.error("Error in getRecipeFromChefClaude:", );
//         throw err
//     }
// }

// export async function getRecipeFromMistral(ingredientsArr) {
//     if (!Array.isArray(ingredientsArr) || ingredientsArr.length === 0) {
//         throw new Error("Ingredients must be a non-empty array.");
//     }
//     const ingredientsString = ingredientsArr.map(String).join(", ");
//     try {
//         const response = await hf.chatCompletion({
//             model: VITE_HF_MODEL,
//             messages: [
//                 { role: "system", content: SYSTEM_PROMPT },
//                 { role: "user", content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!` },
//             ],
//             max_tokens: 1024,
//         });
//         return response.choices[0].message.content;
//     } catch (err) {
//     console.error("Error in getRecipeFromMistral:", err); // log full error
//     throw new Error("Failed to fetch recipe from Mistral. Please try again later.");
// }
// }


import { InferenceClient } from "@huggingface/inference";
 let HfInference = InferenceClient;

const HF_API_KEY = import.meta.env.VITE_HF_ACCESS_TOKEN;
const HF_MODEL = import.meta.env.VITE_HF_MODEL || "mistralai/Mixtral-8x7B-Instruct-v0.1";

const hf = new HfInference(HF_API_KEY);

export async function getRecipeFromHuggingFace(ingredientsArr) {
  if (!Array.isArray(ingredientsArr) || ingredientsArr.length === 0) {
    throw new Error("Ingredients must be a non-empty array.");
  }

  const ingredientString = ingredientsArr.join(", ");

  const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make. 
You don't need to use every ingredient. Try to keep extra ingredients minimal. Return the recipe in markdown format.

User: I have ${ingredientsArr.join(", ")}. What should I make?
`;

  try {
    const result = await hf.chatCompletion({
      model: HF_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `I have ${ingredientString}. What can I make?` },
      ],
      parameters: {
        max_tokens: 512,
        temperature: 0.7,
      },
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("Error in getRecipeFromHuggingFace:", err);
    throw new Error("Failed to fetch recipe from Hugging Face.");
  }
}
