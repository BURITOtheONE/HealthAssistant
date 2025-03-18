// Require needed Libraries
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const User = require('./public/assets/models/User');
const Recipe = require('./public/assets/models/Recipe');
const Ingredient = require('./public/assets/models/Ingredient');
const MealPlan = require('./public/assets/models/MealPlan'); // Add this line
const mealPlannerRoutes = require('./public/assets/routes/mealPlanner'); // Add this line
const app = express();

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
      secure: false, // Ensures cookies are secure in production
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
    res.render('login');});
app.get('/register', (req, res) => res.render('register'));
app.get('/meal-planner', checkAuth, (req, res) => res.render('meal-planner')); // Add checkAuth middleware

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
        req.session.email = user.email;  // Store email in session
        req.session.profileImage = user.profileImage;  // Store profile image in session
        req.session.dateOfBirth = user.dateOfBirth;  // Store date of birth in session
        req.session.gender = user.gender
        req.session.height = user.height;  // Store height in session
        req.session.weight = user.weight;  // Store weight in session
        req.session.save();
        res.redirect('/');  // Redirect to home page after successful login
        console.log('User ID from session:', req.session.userId);
        console.log('User Email from session:', req.session.email);
        console.log('Session after login:', req.session);  // Check if the user is logged in correctly
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


// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profiles');
  },
  filename: function (req, file, cb) {
    cb(null, req.session.userId + path.extname(file.originalname));
  }
});

// Create multer upload instance
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Route to handle profile updates
app.post('/profile/update', checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Update user profile with form data
    const updateData = {
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      height: {
        value: req.body.heightValue,
        unit: req.body.heightUnit
      },
      weight: {
        value: req.body.weightValue,
        unit: req.body.weightUnit
      }
    };
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    // Update session with new user data
    req.session.dateOfBirth = updatedUser.dateOfBirth;
    req.session.gender = updatedUser.gender;
    req.session.height = updatedUser.height;
    req.session.weight = updatedUser.weight;
    req.session.save();
    
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.redirect('/profile');
  }
});

// Route to handle profile picture upload
app.post('/profile/update-picture', checkAuth, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // If a file was uploaded, update profile image path
    if (req.file) {
      const imagePath = '/uploads/profiles/' + req.file.filename;
      
      // Update user profile with new image path
      await User.findByIdAndUpdate(userId, { profileImage: imagePath });
    }
    
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.redirect('/profile');
  }
});

// Route to render profile edit page
app.get('/profile/edit', checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('profile-edit', { user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.redirect('/profile');
  }
});

// Create the uploads directory if it doesn't exist
const fs = require('fs');
const dir = 'public/uploads/profiles';
if (!fs.existsSync(dir)){
  fs.mkdirSync(dir, { recursive: true });
}


// Add this to your existing middleware section
app.use(async (req, res, next) => {
  res.locals.session = req.session;  // Make session available in all views
  
  // Add theme preference to res.locals
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.locals.theme = user.theme;
      }
    } catch (error) {
      console.error('Error fetching user theme preference:', error);
    }
  }
  
  next();
});

// Route to update theme preference
app.post('/update-theme-preference', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { theme } = req.body;
    
    // Update user theme preference
    await User.findByIdAndUpdate(req.session.userId, { theme });
    
    res.status(200).json({ message: 'Theme preference updated' });
  } catch (error) {
    console.error('Error updating theme preference:', error);
    res.status(500).json({ message: 'Error updating theme preference' });
  }
});

// Use meal planner routes
app.use('/meal-planner', mealPlannerRoutes);

// Start server at localhost:1505
app.listen(process.env.PORT || 1505, () => console.log('Server running...'));