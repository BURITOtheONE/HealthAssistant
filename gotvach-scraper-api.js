// recipe-scraper.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Base URL for the website
const BASE_URL = 'https://gotvach.bg';

/**
 * Scrapes a recipe page and extracts detailed information
 * @param {string} url - Full URL to the recipe page
 * @returns {Object} Parsed recipe object
 */
async function scrapeRecipePage(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const title = $('.recipe-title h1').text().trim();
    const imageUrl = $('.recipe-img img').attr('src');
    
    // Extract ingredients
    const ingredients = [];
    $('.products-list li').each((i, el) => {
      const ingredient = $(el).text().trim();
      if (ingredient) ingredients.push(ingredient);
    });
    
    // Extract preparation steps
    const preparationSteps = [];
    $('.text.preparation p').each((i, el) => {
      const step = $(el).text().trim();
      if (step) preparationSteps.push(step);
    });
    
    // Extract cooking time and servings if available
    const cookingTime = $('.iconed-info-line:contains("Време")').text().replace('Време', '').trim();
    const servings = $('.iconed-info-line:contains("Порции")').text().replace('Порции', '').trim();
    
    // Additional metadata
    const category = $('.recipe-category').text().trim();
    const difficulty = $('.iconed-info-line:contains("Трудност")').text().replace('Трудност', '').trim();
    
    const recipe = {
      title,
      imageUrl,
      ingredients,
      preparationSteps,
      cookingTime,
      servings,
      category,
      difficulty,
      sourceUrl: url
    };
    
    return recipe;
  } catch (error) {
    console.error('Error scraping recipe page:', error);
    throw new Error('Failed to scrape recipe page');
  }
}

/**
 * Scrapes a category page and extracts recipe links
 * @param {string} categoryUrl - URL to the category page
 * @param {number} page - Page number to scrape
 * @param {number} limit - Maximum number of recipes to return
 * @returns {Array} Array of recipe preview objects with links
 */
async function scrapeCategoryPage(categoryUrl, page = 1, limit = 10) {
  try {
    const url = `${categoryUrl}?page=${page}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const recipes = [];
    
    $('.recipe-list .recipe').each((i, el) => {
      if (recipes.length >= limit) return false;
      
      const title = $(el).find('.recipe-title').text().trim();
      const url = BASE_URL + $(el).find('a').attr('href');
      const imageUrl = $(el).find('img').attr('src');
      const previewText = $(el).find('.recipe-short-text').text().trim();
      
      recipes.push({
        title,
        url,
        imageUrl,
        previewText
      });
    });
    
    return recipes;
  } catch (error) {
    console.error('Error scraping category page:', error);
    throw new Error('Failed to scrape category page');
  }
}

/**
 * Gets all available recipe categories
 * @returns {Array} Array of category objects with names and URLs
 */
async function getCategories() {
  try {
    const response = await axios.get(BASE_URL);
    const $ = cheerio.load(response.data);
    
    const categories = [];
    
    $('#main-nav ul li a').each((i, el) => {
      const name = $(el).text().trim();
      const url = $(el).attr('href');
      
      // Filter out non-recipe categories
      if (url && url.includes('/recipes/') && name) {
        categories.push({
          name,
          url: url.startsWith('http') ? url : BASE_URL + url
        });
      }
    });
    
    return categories;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw new Error('Failed to get recipe categories');
  }
}

/**
 * Search for recipes
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} Array of recipe preview objects
 */
async function searchRecipes(query, limit = 10) {
  try {
    const url = `${BASE_URL}/search.php?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const recipes = [];
    
    $('.recipe-list .recipe').each((i, el) => {
      if (recipes.length >= limit) return false;
      
      const title = $(el).find('.recipe-title').text().trim();
      const url = BASE_URL + $(el).find('a').attr('href');
      const imageUrl = $(el).find('img').attr('src');
      const previewText = $(el).find('.recipe-short-text').text().trim();
      
      recipes.push({
        title,
        url,
        imageUrl,
        previewText
      });
    });
    
    return recipes;
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw new Error('Failed to search recipes');
  }
}

// API Endpoints

// Get all recipe categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recipes by category
app.get('/api/category/:categoryPath', async (req, res) => {
  try {
    const { categoryPath } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const categoryUrl = `${BASE_URL}/${categoryPath}`;
    const recipes = await scrapeCategoryPage(categoryUrl, page, parseInt(limit));
    
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific recipe by URL
app.get('/api/recipe', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    const recipe = await scrapeRecipePage(url);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search for recipes
app.get('/api/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter (q) is required' });
    }
    
    const recipes = await searchRecipes(q, parseInt(limit));
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk download recipes - gets multiple recipes in a single request
app.post('/api/bulk-download', async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Array of URLs is required' });
    }
    
    // Limit the number of concurrent requests to avoid overwhelming the server
    const MAX_CONCURRENT = 5;
    const results = [];
    const errors = [];
    
    // Process URLs in batches
    for (let i = 0; i < urls.length; i += MAX_CONCURRENT) {
      const batch = urls.slice(i, i + MAX_CONCURRENT);
      const promises = batch.map(url => 
        scrapeRecipePage(url)
          .then(recipe => results.push(recipe))
          .catch(error => {
            console.error(`Error scraping ${url}:`, error);
            errors.push({ url, error: error.message });
          })
      );
      
      await Promise.all(promises);
    }
    
    res.json({
      success: results.length,
      failed: errors.length,
      recipes: results,
      errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper endpoint to download all recipes from a category and store in database
app.post('/api/download-category', async (req, res) => {
  try {
    const { categoryPath, pages = 1 } = req.body;
    
    if (!categoryPath) {
      return res.status(400).json({ error: 'Category path is required' });
    }
    
    const allRecipes = [];
    const errors = [];
    
    // Loop through each page and collect recipe URLs
    for (let page = 1; page <= pages; page++) {
      const categoryUrl = `${BASE_URL}/${categoryPath}`;
      const recipeLinks = await scrapeCategoryPage(categoryUrl, page, 100);  // Get up to 100 recipes per page
      
      // Download each recipe
      for (const link of recipeLinks) {
        try {
          const recipe = await scrapeRecipePage(link.url);
          allRecipes.push(recipe);
          console.log(`Downloaded recipe: ${recipe.title}`);
        } catch (error) {
          console.error(`Error downloading ${link.url}:`, error);
          errors.push({ url: link.url, error: error.message });
        }
      }
    }
    
    res.json({
      category: categoryPath,
      pagesScraped: pages,
      recipesDownloaded: allRecipes.length,
      errors: errors.length,
      recipes: allRecipes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Additional endpoint to integrate with your MongoDB database
app.post('/api/save-recipes', async (req, res) => {
  // This is a placeholder for the database integration
  // You would implement this based on your Recipe model
  res.status(501).json({ message: 'Not implemented yet - will be connected to your database' });
});

// Start the server
const PORT = process.env.SCRAPER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Recipe scraper API running on port ${PORT}`);
});

module.exports = app;
