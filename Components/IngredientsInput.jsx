export default function IngredientsInput(props){
    return (
        <form action={props.addIngredient} className="input-box">
        <input
          className="ingredient-input"
          aria-label="Add Ingredients"
          type="text"
          placeholder="e.g. tomato sauce"
          name="ingredient"
        />

        <button className="add-ingredient-button">+ Add Ingredient</button>
      </form>
    )
}