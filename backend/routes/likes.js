const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

// POST /api/likes/article/:articleId - Toggles a like (adds or removes)
router.post('/article/:articleId', authenticate, (req, res) => {
  const { articleId } = req.params;

  try {
    // Verify article exists
    const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    // Check if like exists
    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND article_id = ?').get(req.user.id, articleId);

    if (existing) {
      // Remove like
      db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      
      const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE article_id = ?').get(articleId).count;
      return res.status(200).json({ success: true, liked: false, like_count: count });
    } else {
      // Add like
      db.prepare(`
        INSERT INTO likes (id, user_id, article_id)
        VALUES (?, ?, ?)
      `).run(uuidv4(), req.user.id, articleId);
      
      const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE article_id = ?').get(articleId).count;
      return res.status(200).json({ success: true, liked: true, like_count: count });
    }
  } catch (err) {
    console.error('Toggle like error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// GET /api/likes/article/:articleId - Gets like metrics and checks status
router.get('/article/:articleId', optionalAuth, (req, res) => {
  const { articleId } = req.params;

  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE article_id = ?').get(articleId).count;
    
    let liked = false;
    if (req.user) {
      const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND article_id = ?').get(req.user.id, articleId);
      liked = !!existing;
    }

    return res.status(200).json({ success: true, liked, like_count: count });
  } catch (err) {
    console.error('Fetch like statistics error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
