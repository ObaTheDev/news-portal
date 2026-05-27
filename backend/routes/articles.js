const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');

// Helper to generate a unique slug
function generateSlug(title) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  // Verify uniqueness of slug; append random numbers if clash
  const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(baseSlug);
  if (existing) {
    baseSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return baseSlug;
}

// GET /api/articles - Paginated feed list with sorting and filtering options
router.get('/', optionalAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  const categorySlug = req.query.category;
  const searchQuery = req.query.search;
  const sortBy = req.query.sort || 'newest';
  const status = req.query.status || 'published'; // admin can query 'all' or 'draft'

  let queryConditions = [];
  let queryParams = [];

  // Filter status
  if (status !== 'all') {
    queryConditions.push('a.status = ?');
    queryParams.push(status);
  }

  // Filter category slug
  if (categorySlug) {
    queryConditions.push('c.slug = ?');
    queryParams.push(categorySlug);
  }

  // Filter search queries
  if (searchQuery) {
    queryConditions.push('(a.title LIKE ? OR a.content LIKE ? OR a.excerpt LIKE ?)');
    const likeVal = `%${searchQuery}%`;
    queryParams.push(likeVal, likeVal, likeVal);
  }

  const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

  // Calculate order clauses
  let orderClause = 'ORDER BY a.created_at DESC';
  if (sortBy === 'popular') {
    orderClause = 'ORDER BY a.views DESC, a.created_at DESC';
  } else if (sortBy === 'trending') {
    // Trending formula: views + likes * 3 (calculated via subqueries or count columns)
    orderClause = 'ORDER BY (a.views + (SELECT COUNT(*) FROM likes WHERE article_id = a.id) * 3) DESC, a.created_at DESC';
  }

  try {
    // Count total matches
    const totalCountQuery = `
      SELECT COUNT(*) as count 
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
    `;
    const totalCount = db.prepare(totalCountQuery).get(...queryParams).count;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch matching details
    // We subquery bookmark/like counts, and if authenticated, whether the user has bookmarked or liked it
    const userId = req.user ? req.user.id : null;

    const dataQuery = `
      SELECT 
        a.id, 
        a.title, 
        a.slug, 
        a.excerpt, 
        a.cover_image, 
        a.views, 
        a.status,
        a.created_at, 
        a.updated_at,
        c.name as category_name, 
        c.slug as category_slug, 
        u.display_name as author_name,
        (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comment_count,
        ${userId ? `(SELECT COUNT(*) FROM bookmarks WHERE user_id = ? AND article_id = a.id) > 0` : '0'} as bookmarked,
        ${userId ? `(SELECT COUNT(*) FROM likes WHERE user_id = ? AND article_id = a.id) > 0` : '0'} as liked
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const fetchParams = [];
    if (userId) {
      fetchParams.push(userId, userId);
    }
    fetchParams.push(...queryParams, limit, offset);

    const items = db.prepare(dataQuery).all(...fetchParams);

    // Clean up boolean conversion in sqlite returns
    const processedItems = items.map(item => ({
      ...item,
      bookmarked: !!item.bookmarked,
      liked: !!item.liked,
    }));

    return res.status(200).json({
      success: true,
      data: processedItems,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error('List articles error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// GET /api/articles/by-id/:id (admin dashboard detail fetcher)
router.get('/by-id/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const article = db.prepare(`
      SELECT * FROM articles WHERE id = ?
    `).get(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    return res.status(200).json({ success: true, data: article });
  } catch (err) {
    console.error('Get article by ID error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// GET /api/articles/:slug - Increments views, yields full article with auth metrics and likes count
router.get('/:slug', optionalAuth, (req, res) => {
  const { slug } = req.params;

  try {
    // Check article exists
    const articleCheck = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
    if (!articleCheck) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    const articleId = articleCheck.id;

    // Increment view count
    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(articleId);

    const userId = req.user ? req.user.id : null;

    // Fetch full detail
    const details = db.prepare(`
      SELECT 
        a.id, 
        a.title, 
        a.slug, 
        a.excerpt, 
        a.content, 
        a.cover_image, 
        a.views, 
        a.created_at, 
        a.updated_at,
        c.id as category_id,
        c.name as category_name, 
        c.slug as category_slug, 
        u.display_name as author_name,
        u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comment_count,
        ${userId ? `(SELECT COUNT(*) FROM bookmarks WHERE user_id = ? AND article_id = a.id) > 0` : '0'} as bookmarked,
        ${userId ? `(SELECT COUNT(*) FROM likes WHERE user_id = ? AND article_id = a.id) > 0` : '0'} as liked
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `);

    const params = [];
    if (userId) {
      params.push(userId, userId);
    }
    params.push(articleId);

    const data = details.get(...params);

    const processedData = {
      ...data,
      bookmarked: !!data.bookmarked,
      liked: !!data.liked,
    };

    return res.status(200).json({ success: true, data: processedData });
  } catch (err) {
    console.error('Fetch article detail error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// POST /api/articles - Requires admin permission
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { title, cover_image, category_id, excerpt, content, status } = req.body;

  if (!title || !category_id || !content) {
    return res.status(400).json({ success: false, error: 'Please provide a title, category, and body content.' });
  }

  try {
    const id = uuidv4();
    const slug = generateSlug(title);
    const excerptVal = excerpt || (content.replace(/<[^>]*>/g, '').substring(0, 150) + '...');

    db.prepare(`
      INSERT INTO articles (id, title, slug, excerpt, content, cover_image, category_id, author_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      slug,
      excerptVal,
      content,
      cover_image || '',
      category_id,
      req.user.id,
      status || 'published'
    );

    const newArticle = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    return res.status(201).json({ success: true, data: newArticle });
  } catch (err) {
    console.error('Create article error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// PUT /api/articles/:id - Requires admin permission
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { title, cover_image, category_id, excerpt, content, status } = req.body;

  if (!title || !category_id || !content) {
    return res.status(400).json({ success: false, error: 'Please provide a title, category, and body content.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article does not exist.' });
    }

    const excerptVal = excerpt || (content.replace(/<[^>]*>/g, '').substring(0, 150) + '...');

    db.prepare(`
      UPDATE articles 
      SET title = ?, cover_image = ?, category_id = ?, excerpt = ?, content = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title,
      cover_image || '',
      category_id,
      excerptVal,
      content,
      status || 'published',
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update article error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// DELETE /api/articles/:id - Requires admin permission
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article does not exist.' });
    }

    // Cascade options in sqlite table definitions handle foreign keys automatically
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
    return res.status(200).json({ success: true, message: 'Article deleted successfully.' });
  } catch (err) {
    console.error('Delete article error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
