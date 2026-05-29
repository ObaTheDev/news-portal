const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.created_at,
              c.name as category_name, c.slug as category_slug, c.color as category_color,
              u.username as author_username, u.display_name as author_display_name,
              b.created_at as bookmarked_at
       FROM bookmarks b
       JOIN articles a ON b.article_id = a.id
       JOIN categories c ON a.category_id = c.id
       JOIN users u ON a.author_id = u.id
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, bookmarks: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bookmarks.' });
  }
});

router.post('/:articleId', authenticate, async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id=$1 AND article_id=$2',
      [req.user.id, req.params.articleId]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM bookmarks WHERE user_id=$1 AND article_id=$2', [req.user.id, req.params.articleId]);
      return res.json({ success: true, bookmarked: false });
    }
    await pool.query('INSERT INTO bookmarks (id, user_id, article_id) VALUES ($1,$2,$3)', [uuidv4(), req.user.id, req.params.articleId]);
    res.json({ success: true, bookmarked: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle bookmark.' });
  }
});

module.exports = router;