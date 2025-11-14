const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  meals: {
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' },
    snacks: { type: String, default: '' }
  }
});

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = MealPlan;