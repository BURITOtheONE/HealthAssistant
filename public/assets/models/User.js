const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // Core user identification
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true
    },

    // Personal information for recipe personalization
    profileImage: {
        type: String,
        default: 'assets/img/pfp.png' // Default profile picture path
    },
    dateOfBirth: {
        type: Date,
        // Not required but useful for age-appropriate recipes
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer not to say'],
        // Optional but helpful for nutritional recommendations
    },

    // Physical characteristics for nutritional calculations
    height: {
        value: Number,
        unit: {
            type: String,
            enum: ['cm', 'in'],
            default: 'cm'
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['kg', 'lbs'],
            default: 'kg'
        },
        // Weight history could be valuable for tracking progress
        history: [{
            value: Number,
            date: {
                type: Date,
                default: Date.now
            }
        }]
    },

    // Health-related information
    dietaryRestrictions: [{
        type: String,
        enum: [
            'vegetarian',
            'vegan',
            'gluten-free',
            'dairy-free',
            'nut-free',
            'halal',
            'kosher',
            'other'
        ]
    }],
    allergies: [{
        type: String,
        // Store specific food allergies for filtering recipes
    }],
    healthConditions: [{
        condition: String,
        // Store health conditions that affect diet
        dietaryImplications: [String]
        // Associated dietary requirements
    }],

    // Medication considerations for recipe interactions
    medications: [{
        name: String,
        dietaryInteractions: [String],
        // Store medications that might interact with certain foods
        timeOfDay: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'with_food', 'without_food']
        }
    }],

    // Preferences for recipe recommendations
    cuisinePreferences: [{
        type: String,
        // Store preferred cuisine types
    }],
    spiceTolerance: {
        type: String,
        enum: ['mild', 'medium', 'hot', 'very_hot'],
        default: 'medium'
    },
    cookingSkillLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },

    // Recipe interaction tracking
    favoriteRecipes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
    }],
    cookedRecipes: [{
        recipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        },
        dateCooked: {
            type: Date,
            default: Date.now
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        }
    }]
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Calculate BMI - useful for recipe portion sizing and health recommendations
UserSchema.methods.calculateBMI = function() {
    if (!this.height?.value || !this.weight?.value) return null;
    
    let heightInM = this.height.unit === 'cm' ? 
        this.height.value / 100 : 
        this.height.value * 0.0254;
    
    let weightInKg = this.weight.unit === 'kg' ? 
        this.weight.value : 
        this.weight.value * 0.45359237;
    
    return weightInKg / (heightInM * heightInM);
};

// Helper method to get age - useful for age-appropriate recipes
UserSchema.methods.getAge = function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

module.exports = mongoose.model('User', UserSchema);