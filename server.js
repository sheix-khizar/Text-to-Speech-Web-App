require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'TTS Maker',
        page: 'home'
    });
});

app.get('/about', (req, res) => {
    res.render('about', { 
        title: 'TTS Maker',
        page: 'about'
    });
});

// API endpoint for future server-side TTS implementation
app.post('/api/tts', (req, res) => {
    // This would connect to a TTS service like Google Cloud TTS
    // For now, just a placeholder
    res.json({
        success: false,
        message: 'Server-side TTS not implemented. Using browser TTS instead.'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});