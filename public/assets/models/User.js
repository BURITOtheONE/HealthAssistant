const mongoose = require('mongoose');

// Blueprint for a User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        email: { type: String, required: true, unique: true },
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true,
    }
});

// Export User model
module.exports = mongoose.model('User', UserSchema);