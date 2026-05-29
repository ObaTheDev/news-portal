const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(a.id) as article_count
       FROM categories c LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
       GROUP BY c.id ORDER BY c.name`
    );
    res.json({ success: true, categories: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories WHERE slug = $1', [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Category not found.' });
    res.json({ success: true, category: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch category.' });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, color, icon } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, error: 'Name and slug are required.' });
    const id = uuidv4();
    const { rows } = await pool.query(
      `INSERT INTO categories (id, name, slug, description, color, icon) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, name, slug, description || '', color || '#C45D3E', icon || 'folder']
    );
    res.status(201).json({ success: true, category: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create category.' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, color, icon } = req.body;
    const { rows } = await pool.query(
      `UPDATE categories SET name=$1, slug=$2, description=$3, color=$4, icon=$5 WHERE id=$6 RETURNING *`,
      [name, slug, description, color, icon, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Category not found.' });
    res.json({ success: true, category: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update category.' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Category not found.' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete category.' });
  }
});

module.exports = router;