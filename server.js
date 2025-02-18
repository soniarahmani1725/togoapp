require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('./models/userModel'); // Import User model
const session = require('express-session');
const app = express();

// Session Middleware
app.use(session({
    secret: "your-secret-key",  // Change this to a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }  // Set to true if using HTTPS
}));



// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('DB Connection Error:', err));

// Routes
app.get('/', (req, res) =>{
	const user = req.session.user || null;
	res.render('pages/home')});
app.get('/services', (req, res) => res.render('pages/services'));
app.get('/about', (req, res) => res.render('pages/about'));
app.get('/signup', (req, res) => res.render('pages/signup'));
app.get('/login', (req, res) => res.render('pages/login'));
app.get('/contact', (req, res) => res.render('pages/contact'));
app.get("/api/user", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in" });
    }
    res.json({ name: req.session.user.name });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});





// User Signup
app.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, country, phone, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).send("Passwords do not match");
        }

        // 🔹 Create new user
        const newUser = new User({ firstName, lastName, country, phone, email, password });

        // 🔹 Save user in MongoDB
        await newUser.save();
		res.redirect('/login');
    } catch (error) {
        console.error("Signup Error:", error);

        if (error.code === 11000) {
            return res.status(400).json({ error: "User with this email or phone already exists" });
        }

        res.status(500).json({ error: "Error signing up" });
    }
});



// User Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send("User not found");
        }

        const isMatch = await user.comparePassword(password); // ✅ Correct Usage
        if (!isMatch) {
            return res.status(400).send("Incorrect password");
        }

        req.session.user = { name: user.firstName, email: user.email }; // ✅ Fix: Use firstName
        res.status(200).json({message:"Login successful"});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server error"});
    }
});



// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
