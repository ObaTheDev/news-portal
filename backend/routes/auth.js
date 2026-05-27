const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'news-portal-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide a username, email, and password.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username or email already registered.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create user
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, role)
      VALUES (?, ?, ?, ?, ?, 'user')
    `).run(userId, username, email, passwordHash, username);

    const user = {
      id: userId,
      username,
      email,
      display_name: username,
      role: 'user',
      avatar_url: '',
      bio: ''
    };

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide an email and password.' });
  }

  try {
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const userObj = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      avatar_url: user.avatar_url || '',
      bio: user.bio || ''
    };

    return res.status(200).json({ success: true, token, user: userObj });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, display_name, role, avatar_url, bio FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req, res) => {
  const { display_name, bio, avatar_url } = req.body;

  if (!display_name) {
    return res.status(400).json({ success: false, error: 'Display name cannot be empty.' });
  }

  try {
    db.prepare(`
      UPDATE users 
      SET display_name = ?, bio = ?, avatar_url = ?
      WHERE id = ?
    `).run(display_name, bio || '', avatar_url || '', req.user.id);

    const updatedUser = db.prepare('SELECT id, username, email, display_name, role, avatar_url, bio FROM users WHERE id = ?').get(req.user.id);
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
