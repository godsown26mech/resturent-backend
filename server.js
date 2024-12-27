require('dotenv').config(); // Load environment variables
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // To handle form data (x-www-form-urlencoded)

// Nodemailer transporter setup with environment variables for credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Set in .env file
        pass: process.env.EMAIL_PASS, // Set in .env file
    },
});

// Route to handle order submission
app.post('/place_order', (req, res) => {
    // Log the incoming request body to check the data format
    console.log('Received order data:', req.body);

    const { items, room_number, userEmail } = req.body;

    const restaurant_email = process.env.EMAIL_USER; // Restaurant's email

    // Log the incoming request for debugging (only in development mode)
    if (process.env.NODE_ENV === 'development') {
        console.log('Received order:', req.body);
    }

    // Validate required fields
    if (!Array.isArray(items) || items.length === 0 || !userEmail) {
        return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    // Create order summary
    const orderSummary = `
        <h3>New Order Received:</h3>
        <ul>
            ${items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <p><strong>Room Number:</strong> ${room_number || 'Not provided'}</p>
        <p><strong>Customer Email:</strong> ${userEmail}</p>
    `;

    // Email options
    const mailOptions = {
        from: process.env.EMAIL_USER, // Use your email
        to: restaurant_email,         // Restaurant's email
        subject: 'New Order Received',
        html: orderSummary,           // Order details
        replyTo: userEmail,          // Optional reply-to for restaurant
    };

    // Send email
    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.error('Error sending email:', error.message || error);
            return res.status(500).json({ error: 'Failed to send order' });
        }
        console.log('Order email sent successfully to the restaurant');
        res.status(200).json({ message: 'Order placed successfully!' });
    });
});

// Default route
app.get('/', (req, res) => {
    res.status(200).send(`
        <h1>Welcome to the Restaurant Backend API!</h1>
        <p>Use <code>POST /place_order</code> to place an order.</p>
    `);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
