const DIETARY_PREFS = [
    { label: 'Vegetarian',         value: 'Vegetarian' },
    { label: 'Vegan',              value: 'Vegan' },
    { label: 'Gluten-Free',        value: 'Gluten-Free' },
    { label: 'High Protein',       value: 'High Protein' },
    { label: 'Quick (under 30 min)', value: 'Quick (under 30 min)' },
];

export default function IngredientsList(props) {
    return (
        <>
            <h1 className="list-title">
                {props.ingredients.length > 0 ? "Ingredients on hand:" : ""}
            </h1>
            <div className="list">
                <ul>{props.ingredientsListItems}</ul>
            </div>

            {props.ingredients.length > 3 && (
                <>
                    <div className="dietary-prefs">
                        {DIETARY_PREFS.map(pref => (
                            <button
                                key={pref.value}
                                className={`pref-chip${props.preferences.includes(pref.value) ? ' pref-chip--active' : ''}`}
                                onClick={() => props.togglePreference(pref.value)}
                            >
                                {pref.label}
                            </button>
                        ))}
                    </div>
                    <div className="recipe-generator">
                        <div className="recipe-generator-text">
                            <h3>Ready for a Recipe?</h3>
                            <p>Generate a recipe from your list of ingredients.</p>
                        </div>
                        <button onClick={props.getRecipe} className="get-recipe-btn">Get a Recipe</button>
                    </div>
                </>
            )}
        </>
    );
}
