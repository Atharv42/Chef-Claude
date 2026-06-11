import React from 'react';
import ReactMarkdown from 'react-markdown';

function RecipeSkeleton() {
    return (
        <div className="skeleton-wrapper">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton-line" style={{ width: '60%', marginBottom: '24px' }} />

            <div className="skeleton-line skeleton-heading" />
            <div className="skeleton-line" style={{ width: '55%' }} />
            <div className="skeleton-line" style={{ width: '45%' }} />
            <div className="skeleton-line" style={{ width: '65%' }} />
            <div className="skeleton-line" style={{ width: '50%', marginBottom: '24px' }} />

            <div className="skeleton-line skeleton-heading" />
            <div className="skeleton-line" style={{ width: '90%' }} />
            <div className="skeleton-line" style={{ width: '85%' }} />
            <div className="skeleton-line" style={{ width: '92%' }} />
            <div className="skeleton-line" style={{ width: '75%' }} />
        </div>
    );
}

export default function ClaudeRecipe({ recipeContent, isLoading, error }) {
    return (
        <section>
            <h2>Chef Claude Recommends:</h2>
            <article className="suggested-recipe-container" aria-live="polite">
                {isLoading && !recipeContent ? (
                    <RecipeSkeleton />
                ) : error ? (
                    <div className="recipe-error">
                        <strong>Couldn't generate a recipe</strong>
                        <p>{error}</p>
                    </div>
                ) : (
                    <ReactMarkdown>{recipeContent}</ReactMarkdown>
                )}
            </article>
        </section>
    );
}
