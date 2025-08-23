export default function IngredientsList(props){
    return (
        <>
        <h1 className="list-title">
        {props.ingredients.length > 0 ? "Ingredients on hand:" : ""}
      </h1>
      <div className="list">
        <ul>{props.ingredientsListItems}</ul>
      </div>

      {props.ingredients.length > 3 && (
        <div className="recipe-generator">
          <div className="recipe-generator-text">
            <h3>Ready for a Recipe?</h3>
            <p>Generate a recipe from your list of ingredients.</p>
          </div>
          <button onClick={props.getRecipe} className="get-recipe-btn">Get a Recipe</button>
        </div>
      )}
      </>
    )
}