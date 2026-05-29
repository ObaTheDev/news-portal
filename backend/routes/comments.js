const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/:articleId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.id as user_id, u.username, u.display_name, u.avatar_url
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.article_id = $1 ORDER BY c.created_at ASC`,
      [req.params.articleId]
    );
    res.json({ success: true, comments: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch comments.' });
  }
});

router.post('/:articleId', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ success: false, error: 'Comment content is required.' });
    const id = uuidv4();
    await pool.query(
      'INSERT INTO comments (id, article_id, user_id, content) VALUES ($1,$2,$3,$4)',
      [id, req.params.articleId, req.user.id, content.trim()]
    );
    const { rows } = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.id as user_id, u.username, u.display_name, u.avatar_url
       FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
      [id]
    );
    res.status(201).json({ success: true, comment: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to post comment.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Comment not found.' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Not authorized.' });
    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete comment.' });
  }
});

module.exports = router;