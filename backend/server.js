const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database (runs migrations & seed data if empty)
const db = require('./db/database');

// Configure Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload static folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Serve static uploads
app.use('/uploads', express.static(uploadDir));

// Register REST API Route Handlers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/likes', require('./routes/likes'));

// Default Health Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'REST API fully functional' });
});

// Global Centralized Error Boundary Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error Boundary triggered:', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error occurred.' 
      : err.message || 'Internal server error occurred.'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server launched successfully on port ${PORT}`);
  console.log(`CORS allowed origins configured for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`Database source file connected at: ${path.resolve(__dirname, 'data/news-portal.sqlite')}`);
});
