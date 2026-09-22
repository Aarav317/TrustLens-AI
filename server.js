require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');c
onst express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic server setup
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// AI analysis route
app.post('/api/analyze', async (req, res) => {
    try {
        const API_KEY = process.env.GEMINI_API_KEY;

        // Make sure the API key exists on the server
        if (!API_KEY) {
            console.error('GEMINI_API_KEY is missing.');
            return res.status(500).json({
                error: 'API key is missing on the server.'
            });
        }

        const GEMINI_MODEL = 'gemini-3.6-flash';

        const GEMINI_URL =
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

        // Send the user's analysis request to Gemini
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        // Gemini returned an error
        if (!response.ok) {
            const geminiMessage =
                data.error?.message || 'Gemini API returned an error.';

            console.error(
                `Gemini API Error | Status: ${response.status} | Message: ${geminiMessage}`
            );

            // Rate limit / quota
            if (response.status === 429) {
                return res.status(429).json({
                    error: 'Gemini API rate limit or quota reached. Please try again.'
                });
            }

            // Temporary Gemini availability/capacity issue
            if (response.status === 503) {
                return res.status(503).json({
                    error: 'Gemini is temporarily unavailable or experiencing high demand. Please try again.'
                });
            }

            // Other Gemini API errors
            return res.status(response.status).json({
                error: geminiMessage
            });
        }

        // Successful Gemini response
        res.json(data);

    } catch (error) {
        console.error(
            'Server Error during Gemini analysis:',
            error.message
        );

        res.status(500).json({
            error: 'Unable to complete AI analysis right now. Please try again.'
        });
    }
});


// Send the main website to the browser
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});