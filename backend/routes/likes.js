const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.post('/:articleId', authenticate, async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT id FROM likes WHERE user_id=$1 AND article_id=$2',
      [req.user.id, req.params.articleId]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id=$1 AND article_id=$2', [req.user.id, req.params.articleId]);
      const { rows } = await pool.query('SELECT COUNT(*) FROM likes WHERE article_id=$1', [req.params.articleId]);
      return res.json({ success: true, liked: false, like_count: parseInt(rows[0].count) });
    }
    await pool.query('INSERT INTO likes (id, user_id, article_id) VALUES ($1,$2,$3)', [uuidv4(), req.user.id, req.params.articleId]);
    const { rows } = await pool.query('SELECT COUNT(*) FROM likes WHERE article_id=$1', [req.params.articleId]);
    res.json({ success: true, liked: true, like_count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle like.' });
  }
});

module.exports = router;