const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

// GET /api/comments/article/:articleId - Lists all comments associated with the article
router.get('/article/:articleId', (req, res) => {
  try {
    // Verify article exists
    const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.articleId);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    const comments = db.prepare(`
      SELECT 
        c.id, 
        c.content, 
        c.created_at, 
        c.user_id,
        u.username, 
        u.display_name, 
        u.avatar_url,
        u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ?
      ORDER BY c.created_at DESC
    `).all(req.params.articleId);

    return res.status(200).json({ success: true, data: comments });
  } catch (err) {
    console.error('List comments error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// POST /api/comments/article/:articleId - Requires authentication to publish comments
router.post('/article/:articleId', authenticate, (req, res) => {
  const { content } = req.body;
  const { articleId } = req.params;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Comment body content is required.' });
  }

  try {
    // Verify article exists
    const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    const commentId = uuidv4();
    db.prepare(`
      INSERT INTO comments (id, article_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `).run(commentId, articleId, req.user.id, content.trim());

    // Fetch the recently created comment with user tags joined
    const created = db.prepare(`
      SELECT 
        c.id, 
        c.content, 
        c.created_at, 
        c.user_id,
        u.username, 
        u.display_name, 
        u.avatar_url,
        u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    return res.status(201).json({ success: true, comment: created });
  } catch (err) {
    console.error('Publish comment error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// DELETE /api/comments/:id - Requires authentication, gates creator ownership or admin roles
router.delete('/:id', authenticate, (req, res) => {
  try {
    const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found.' });
    }

    const isOwner = comment.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied. You can only delete your own comments.' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    return res.status(200).json({ success: true, message: 'Comment deleted successfully.' });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
