const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

// All endpoints in this router require token validation
router.use(authenticate);

// GET /api/bookmarks - Returns all bookmarked articles for the current logged-in user
router.get('/', (req, res) => {
  try {
    const list = db.prepare(`
      SELECT 
        a.id, 
        a.title, 
        a.slug, 
        a.excerpt, 
        a.cover_image, 
        a.views, 
        a.created_at, 
        c.name as category_name, 
        c.slug as category_slug, 
        u.display_name as author_name,
        b.created_at as bookmarked_at
      FROM bookmarks b
      JOIN articles a ON b.article_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE b.user_id = ? AND a.status = 'published'
      ORDER BY b.created_at DESC
    `).all(req.user.id);

    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error('Fetch bookmarks error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// POST /api/bookmarks/:articleId - Toggles bookmark state (adds or deletes)
router.post('/:articleId', (req, res) => {
  const { articleId } = req.params;

  try {
    // Verify article exists
    const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    // Check if bookmark exists
    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND article_id = ?').get(req.user.id, articleId);

    if (existing) {
      // Remove bookmark
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
      return res.status(200).json({ success: true, bookmarked: false });
    } else {
      // Add bookmark
      db.prepare(`
        INSERT INTO bookmarks (id, user_id, article_id)
        VALUES (?, ?, ?)
      `).run(uuidv4(), req.user.id, articleId);
      return res.status(200).json({ success: true, bookmarked: true });
    }
  } catch (err) {
    console.error('Toggle bookmark error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// GET /api/bookmarks/check/:articleId - Verifies if user has bookmarked this article
router.get('/check/:articleId', (req, res) => {
  const { articleId } = req.params;

  try {
    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND article_id = ?').get(req.user.id, articleId);
    return res.status(200).json({ success: true, bookmarked: !!existing });
  } catch (err) {
    console.error('Verify bookmark check error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
