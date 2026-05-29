const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/database');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'news-portal-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ success: false, error: 'Please provide a username, email, and password.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });

  if (password.length < 6)
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ success: false, error: 'Username or email already registered.' });

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    const { rows } = await pool.query(
      `INSERT INTO users (id, username, email, password_hash, display_name, role)
       VALUES ($1,$2,$3,$4,$5,'user') RETURNING id, username, email, display_name, role, avatar_url, bio, created_at`,
      [id, username, email, passwordHash, username]
    );

    const user = rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, error: 'Please provide email and password.' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, display_name, role, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user.' });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  const { display_name, bio, avatar_url } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET display_name=$1, bio=$2, avatar_url=$3
       WHERE id=$4 RETURNING id, username, email, display_name, role, avatar_url, bio, created_at`,
      [display_name, bio, avatar_url, req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Profile update failed.' });
  }
});

module.exports = router;