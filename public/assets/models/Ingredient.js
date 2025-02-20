const mongoose = require('mongoose');

// Blueprint for Ingredient Schema
const ingredientSchema = new mongoose.Schema({
    // Creator field used to associate ingredients with a specific user
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model
        required: true  // Ensure that an ingredient is always associated with a user
    },
    name: {
        type: String,
        required: true  // Ingredient name is mandatory
    },
    quantity: {
        type: Number,
        required: true,  // Quantity is mandatory
        default: 1  // Default quantity is 1
    },
    unit: {
        type: String,
        required: true,  // Unit of measurement is mandatory
        enum: ['grams', 'kilograms', 'kg', 'ml', 'milliliters', 'liters', 'pieces'], // Allowed units
        default: 'grams'  // Default unit is 'grams'
    },
    category: {
        type: String,
        required: true,  // Category is mandatory
        enum: ['vegetables', 'fruits', 'meat', 'dairy', 'grains', 'other'], // Allowed categories
        default: 'other'
    },
    expirationDate: {
        type: Date,
        required: false,  // Optional field for expiration date
    },
    addedDate: {
        type: Date,
        required: true,
        default: Date.now  // Automatically set to the current date
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false  // Tracks if the ingredient is marked as deleted
    }
});

// Export Ingredient model
module.exports = mongoose.model('Ingredient', ingredientSchema);