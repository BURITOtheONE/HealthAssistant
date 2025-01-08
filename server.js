// Require needed Libraries
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./public/assets/models/User');
const app = express();

// Connect to The DataBase
mongoose.connect('mongodb://127.0.0.1:27017/HealthAssistant', {});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

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
app.get('/fridge', (req, res) => res.render('fridge'));
app.get('/recipe', (req, res) => res.render('recipe'));

// Still in progress
app.get('/myRecipes', (req, res) => res.render('myRecipes'));
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
  
    // Start server at localhost:1505
    app.listen(process.env.PORT || 1505, () => console.log('Server running...'));