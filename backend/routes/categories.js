const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/categories - Lists all categories with their respective article counts
router.get('/', (req, res) => {
  try {
    const list = db.prepare(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.description, 
        c.color, 
        c.icon,
        (SELECT COUNT(*) FROM articles WHERE category_id = c.id AND status = 'published') as article_count
      FROM categories c
      ORDER BY c.name ASC
    `).all();

    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error('List categories error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// GET /api/categories/:slug
router.get('/:slug', (req, res) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }
    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    console.error('Get category error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// POST /api/categories - Requires admin permissions
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, description, color, icon } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required.' });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  try {
    const existing = db.prepare('SELECT id FROM categories WHERE name = ? OR slug = ?').get(name, slug);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Category name or slug already exists.' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO categories (id, name, slug, description, color, icon)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, slug, description || '', color || '#C45D3E', icon || 'folder');

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// PUT /api/categories/:id - Requires admin permissions
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, description, color, icon } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required.' });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  try {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category does not exist.' });
    }

    db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, description = ?, color = ?, icon = ?
      WHERE id = ?
    `).run(name, slug, description || '', color || '#C45D3E', icon || 'folder', req.params.id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// DELETE /api/categories/:id - Requires admin permissions, locks deletions on occupied tags
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category does not exist.' });
    }

    // Check if category has articles
    const articlesCount = db.prepare('SELECT COUNT(*) as count FROM articles WHERE category_id = ?').get(req.params.id).count;
    if (articlesCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete occupied category. Please migrate or delete the articles in it first.' 
      });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    return res.status(200).json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
