// Require needed Libraries
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./public/assets/models/User');
const Recipe = require('./public/assets/models/Recipe');
const Ingredient = require('./public/assets/models/Ingredient');
const app = express();
require('dotenv').config(); 

// Connect to The DataBase
mongoose.connect('mongodb+srv://burito:m%40rtinell2@healthassistant.gb7oc.mongodb.net/')
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB Atlas', err));
// Set up express-session middleware
app.use(
  session({
    secret: 'superSecretKey',  // Replace with actual secret key in the future
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Ensures cookies are secure in production
      maxAge: 1000 * 60 * 60 * 24 // Cookie expires after 1 day
    }
  })
);

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Add this line to parse JSON bodies
app.use(express.static('public'));


app.use((req, res, next) => {
  res.locals.session = req.session;  // Make session available in all views
  next();
});

// Middleware for checking authentication
function checkAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}


// Home page route
app.get('/', async (req, res) => { res.render('index', {}); });

// Routes for other pages
app.get('/fridge', async (req, res) => {
  const userId = req.session.userId; // Get the logged-in user's ID
  try {
    if (!userId) {
      return res.redirect('/login');  // Ensure the user is logged in
    }

    const ingredients = await Ingredient.find({ creator: userId });

    res.render('fridge', { ingredients });
  } catch (error) {
    console.error(error);
    res.redirect('/');  // If an error occurs, redirect to home page
  }
});
app.get('/recipe', (req, res) => res.render('recipe'));

// Still in progress
app.get('/profile', (req, res) => res.render('profile'));
app.get('/settings', (req, res) => res.render('settings'));
app.get('/login', (req, res) =>{
  if(!req.session.userId){
    res.render('login')
  }
  else {
    res.redirect('/')
  }
});
app.get('/register', (req, res) => res.render('register'));

// POST route to register a new User
app.post('/register', async (req, res) => {
    try {
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,  // Store the password directly (no encryption for now)
      });
  
      // Save User
      await newUser.save();
  
      res.redirect('/login');  // Redirect to login after registration
    } catch (error) {
      console.error(error);
      res.redirect('/register');  // If an error occurs, redirect back to registration page
    }
  });
  
  // POST route to register a new User
  app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Find the user by username
      const user = await User.findOne({ username: username });
  
      if (!user) {
        console.log('User not found!');
        return res.redirect('/login');  // Redirect to login if user doesn't exist
      }
  
      // Compare entered password with stored password (no encryption)
      if (password === user.password) {
        console.log('Login successful');
        req.session.userId = user._id;  // Store user ID in session
        req.session.username = user.username;  // Store username in session
        res.redirect('/');  // Redirect to home page after successful login
        console.log('User ID from session:', req.session.userId);  // Check if the user is logged in correctly
      } else {
        console.log('Incorrect password!');
        res.redirect('/login');  // If password doesn't match, redirect to login
      }
    } catch (error) {
      console.error(error);
      res.redirect('/login');  // If an error occurs, redirect to login
    }
  });

  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect('/');  // If an error occurs, redirect back to home
      }
      res.clearCookie('connect.sid');  // Clear the session cookie
      setTimeout(() => {
        res.redirect('/login');  // Redirect to Login after logout
      }, 500);
    });
  });

// POST route to add a new ingredient
app.post('/add-ingredient', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');  // Ensure the user is logged in
    }

    const newIngredient = new Ingredient({
      name: req.body.ingredientName,
      quantity: req.body.quantity,
      unit: req.body.quantityUnit,
      category: req.body.category,
      creator: req.session.userId,
      addedDate: Date.now()
    });

    await newIngredient.save();
    console.log('New ingredient added successfully:', newIngredient);

    res.redirect('/fridge');  // Redirect to fridge page after adding ingredient
  } catch (error) {
    console.error(error);
    res.redirect('/fridge');  // If an error occurs, redirect back to fridge page
  }
});

    // Start server at localhost:1505
    app.listen(process.env.PORT || 1505, () => console.log('Server running...'));