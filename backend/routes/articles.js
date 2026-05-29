const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/database');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

async function generateSlug(title) {
  let baseSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  const { rows } = await pool.query('SELECT id FROM articles WHERE slug = $1', [baseSlug]);
  if (rows.length > 0) baseSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  return baseSlug;
}

// GET /api/articles
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const categorySlug = req.query.category;
    const searchQuery = req.query.search;
    const sortBy = req.query.sort || 'newest';
    const status = req.query.status || 'published';

    let conditions = [];
    let params = [];
    let i = 1;

    if (status !== 'all') { conditions.push(`a.status = $${i++}`); params.push(status); }
    if (categorySlug) { conditions.push(`c.slug = $${i++}`); params.push(categorySlug); }
    if (searchQuery) {
      conditions.push(`(a.title ILIKE $${i} OR a.content ILIKE $${i} OR a.excerpt ILIKE $${i})`);
      params.push(`%${searchQuery}%`); i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const order = sortBy === 'popular' ? 'ORDER BY a.views DESC' :
                  sortBy === 'oldest' ? 'ORDER BY a.created_at ASC' : 'ORDER BY a.created_at DESC';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM articles a LEFT JOIN categories c ON a.category_id = c.id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.status, a.views, a.created_at, a.updated_at,
              c.id as category_id, c.name as category_name, c.slug as category_slug, c.color as category_color, c.icon as category_icon,
              u.id as author_id, u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar_url,
              (SELECT COUNT(*) FROM likes l WHERE l.article_id = a.id) as like_count,
              (SELECT COUNT(*) FROM comments cm WHERE cm.article_id = a.id) as comment_count
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.author_id = u.id
       ${where} ${order} LIMIT $${i} OFFSET $${i+1}`,
      [...params, limit, offset]
    );

    res.json({ success: true, articles: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch articles.' });
  }
});

// GET /api/articles/:slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    await pool.query('UPDATE articles SET views = views + 1 WHERE slug = $1', [req.params.slug]);
    const { rows } = await pool.query(
      `SELECT a.*, c.id as category_id, c.name as category_name, c.slug as category_slug,
              c.color as category_color, c.icon as category_icon,
              u.id as author_id, u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar_url, u.bio as author_bio,
              (SELECT COUNT(*) FROM likes l WHERE l.article_id = a.id) as like_count,
              (SELECT COUNT(*) FROM comments cm WHERE cm.article_id = a.id) as comment_count
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.slug = $1`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Article not found.' });

    let is_liked = false, is_bookmarked = false;
    if (req.user) {
      const likeRes = await pool.query('SELECT id FROM likes WHERE user_id=$1 AND article_id=$2', [req.user.id, rows[0].id]);
      const bookRes = await pool.query('SELECT id FROM bookmarks WHERE user_id=$1 AND article_id=$2', [req.user.id, rows[0].id]);
      is_liked = likeRes.rows.length > 0;
      is_bookmarked = bookRes.rows.length > 0;
    }

    res.json({ success: true, article: { ...rows[0], is_liked, is_bookmarked } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch article.' });
  }
});

// POST /api/articles
router.post('/', authenticate, upload.single('cover_image'), async (req, res) => {
  try {
    const { title, excerpt, content, category_id, status } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, error: 'Title and content are required.' });

    const slug = await generateSlug(title);
    const cover_image = req.file ? `/uploads/${req.file.filename}` : (req.body.cover_image || '');
    const id = uuidv4();

    await pool.query(
      `INSERT INTO articles (id, title, slug, excerpt, content, cover_image, category_id, author_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, title, slug, excerpt || '', content, cover_image, category_id || null, req.user.id, status || 'published']
    );

    const { rows } = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    res.status(201).json({ success: true, article: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create article.' });
  }
});

// PUT /api/articles/:id
router.put('/:id', authenticate, upload.single('cover_image'), async (req, res) => {
  try {
    const { title, excerpt, content, category_id, status } = req.body;
    const existing = await pool.query('SELECT * FROM articles WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ success: false, error: 'Article not found.' });
    if (existing.rows[0].author_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Not authorized.' });

    const cover_image = req.file ? `/uploads/${req.file.filename}` : (req.body.cover_image || existing.rows[0].cover_image);

    const { rows } = await pool.query(
      `UPDATE articles SET title=$1, excerpt=$2, content=$3, cover_image=$4, category_id=$5, status=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title || existing.rows[0].title, excerpt || existing.rows[0].excerpt, content || existing.rows[0].content,
       cover_image, category_id || existing.rows[0].category_id, status || existing.rows[0].status, req.params.id]
    );
    res.json({ success: true, article: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update article.' });
  }
});

// DELETE /api/articles/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM articles WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ success: false, error: 'Article not found.' });
    if (existing.rows[0].author_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Not authorized.' });

    await pool.query('DELETE FROM articles WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete article.' });
  }
});

module.exports = router;