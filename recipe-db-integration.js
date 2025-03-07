// recipe-db-integration.js
const mongoose = require('mongoose');
const Recipe = require('./public/assets/models/Recipe'); // Adjust path as needed
require('dotenv').config();

/**
 * Connects to the MongoDB database
 */
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Saves a recipe to the database
 * @param {Object} recipeData - Recipe data from the scraper
 * @returns {Object} Saved recipe document
 */
async function saveRecipe(recipeData) {
  try {
    // Check if the recipe already exists by title
    const existingRecipe = await Recipe.findOne({ title: recipeData.title });
    
    if (existingRecipe) {
      console.log(`Recipe "${recipeData.title}" already exists in the database`);
      return existingRecipe;
    }
    
    // Transform the scraped data to match your Recipe model
    const recipe = new Recipe({
      title: recipeData.title,
      imageUrl: recipeData.imageUrl,
      ingredients: recipeData.ingredients.map(ingredient => ({
        name: ingredient,
        // You might want to parse quantity and unit from the ingredient string
        // This would require additional processing
      })),
      instructions: recipeData.preparationSteps.join('\n\n'),
      prepTime: recipeData.cookingTime,
      servings: recipeData.servings,
      category: recipeData.category,
      difficulty: recipeData.difficulty,
      sourceUrl: recipeData.sourceUrl,
      // Add any other fields your Recipe model requires
      // You might need a field for creator/user
      creator: process.env.ADMIN_USER_ID // Or some default ID for scraped recipes
    });
    
    const savedRecipe = await recipe.save();
    console.log(`Saved recipe: "${savedRecipe.title}"`);
    return savedRecipe;
  } catch (error) {
    console.error(`Error saving recipe "${recipeData.title}":`, error);
    throw error;
  }
}

/**
 * Saves multiple recipes to the database
 * @param {Array} recipesData - Array of recipe data objects
 * @returns {Object} Results of the bulk save operation
 */
async function saveRecipesBulk(recipesData) {
  try {
    await connectToDatabase();
    
    const results = {
      total: recipesData.length,
      saved: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
    
    for (const recipeData of recipesData) {
      try {
        // Check if the recipe already exists
        const existingRecipe = await Recipe.findOne({ title: recipeData.title });
        
        if (existingRecipe) {
          results.skipped++;
          continue;
        }
        
        await saveRecipe(recipeData);
        results.saved++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          recipe: recipeData.title,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Bulk save error:', error);
    throw error;
  }
}

// Export functions for use in your API
module.exports = {
  connectToDatabase,
  saveRecipe,
  saveRecipesBulk
};
