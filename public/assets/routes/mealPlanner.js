const express = require('express');
const router = express.Router();
const MealPlan = require('../models/MealPlan');

// Get meal plan for a specific date
router.get('/:date', async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ userId: req.session.userId, date: req.params.date });
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
});

// Save or update meal plan for a specific date
router.post('/:date', async (req, res) => {
  try {
    const { breakfast, lunch, dinner, snacks } = req.body;
    const mealPlan = await MealPlan.findOneAndUpdate(
      { userId: req.session.userId, date: req.params.date },
      { meals: { breakfast, lunch, dinner, snacks } },
      { new: true, upsert: true }
    );
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save meal plan' });
  }
});

module.exports = router;