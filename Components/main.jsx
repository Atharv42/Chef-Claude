import React from "react";
import ClaudeRecipe from "./ClaudeRecipe.jsx"
import IngredientsInput from "./IngredientsInput.jsx";
import IngredientsList from "./IngredientsList.jsx";
import { getRecipeFromHuggingFace } from '/Components/ai.js';

export default function Main() {
  const [ingredients, setIngredients] = React.useState([]);

  const [recipeShown, setRecipeShown] = React.useState(false);

  async function getRecipe(){
    const RecipeMarkDown = await getRecipeFromHuggingFace(ingredients);
    console.log(RecipeMarkDown);
  }

  const ingredientsListItems = ingredients.map((ingredient) => (
    <div className="ingredient-container">
      <li key={ingredient}>{ingredient}</li>
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
    event.target.parentElement.removeChild();
  }

  return (
    <main>
        <IngredientsInput addIngredient={addIngredient} />

        <IngredientsList ingredientsListItems={ingredientsListItems} getRecipe={getRecipe} ingredients={ingredients}/>
        
        {recipeShown && <ClaudeRecipe />}
    </main>
  );
  
}
