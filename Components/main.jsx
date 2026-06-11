import React from "react";
import ClaudeRecipe from "./ClaudeRecipe.jsx"
import RecipeHistory from "./RecipeHistory.jsx";
import IngredientsInput from "./IngredientsInput.jsx";
import IngredientsList from "./IngredientsList.jsx";
import { getRecipeFromClaude } from '/Components/ai.js';
import { loadHistory, saveRecipe } from './recipeHistory.js';

export default function Main() {
  const [ingredients, setIngredients] = React.useState([]);
  const [recipeShown, setRecipeShown] = React.useState(false);
  const [recipeContent, setRecipeContent] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [preferences, setPreferences] = React.useState([]);
  const [history, setHistory] = React.useState(() => loadHistory());

  function togglePreference(pref) {
    setPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  }

  function extractTitle(markdown) {
    const match = markdown.match(/^#\s+(.+)/m);
    return match ? match[1].trim() : 'Untitled Recipe';
  }

  async function getRecipe() {
    setRecipeContent("");
    setError(null);
    setRecipeShown(true);
    setIsLoading(true);
    let fullContent = "";
    try {
      await getRecipeFromClaude(ingredients, preferences, (chunk) => {
        setIsLoading(false);
        fullContent += chunk;
        setRecipeContent(prev => prev + chunk);
      });
      const entry = {
        id: String(Date.now()),
        timestamp: Date.now(),
        title: extractTitle(fullContent),
        ingredients: [...ingredients],
        preferences: [...preferences],
        content: fullContent,
      };
      setHistory(saveRecipe(entry));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function onSelectHistoryEntry(entry) {
    setRecipeContent(entry.content);
    setRecipeShown(true);
  }

  const ingredientsListItems = ingredients.map((ingredient) => (
    <div key={ingredient} className="ingredient-container">
      <li>{ingredient}</li>
      <button onClick={remove} className="removebtn">
        x
      </button>
    </div>
  ));

  function addIngredient(formData) {
    const newIngredient = formData.get("ingredient");
    setIngredients((prevIngredients) => [...prevIngredients, newIngredient]);
  }

  function remove(event) {
    const itemToRemove = event.target.previousSibling.textContent;
    setIngredients((prevIngredients) =>
      prevIngredients.filter((ingredient) => ingredient !== itemToRemove)
    );
  }

  return (
    <main>
        <IngredientsInput addIngredient={addIngredient} />

        <IngredientsList
            ingredientsListItems={ingredientsListItems}
            getRecipe={getRecipe}
            ingredients={ingredients}
            preferences={preferences}
            togglePreference={togglePreference}
        />

        {recipeShown && <ClaudeRecipe recipeContent={recipeContent} isLoading={isLoading} error={error} />}
        <RecipeHistory history={history} onSelect={onSelectHistoryEntry} />
    </main>
  );

}
