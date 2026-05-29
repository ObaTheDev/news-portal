const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create all tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        bio TEXT DEFAULT '',
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        color TEXT DEFAULT '#C45D3E',
        icon TEXT DEFAULT 'folder'
      );

      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT DEFAULT '',
        content TEXT NOT NULL,
        cover_image TEXT DEFAULT '',
        category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
        author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published')),
        views INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, article_id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, article_id)
      );
    `);

    // Seed only if empty
    const { rows } = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(rows[0].count) > 0) {
      console.log('Database already initialized with data.');
      return;
    }

    console.log('Seeding fresh database...');

    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const userPasswordHash = bcrypt.hashSync('user123', 10);
    const adminId = uuidv4();
    const userId = uuidv4();

    await client.query(
      `INSERT INTO users (id, username, email, password_hash, display_name, role, avatar_url, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [adminId, 'admin', 'admin@newsportal.com', adminPasswordHash, 'Sarah Jenkins', 'admin',
       'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150',
       'Senior Editorial Director at The Daily Digest.']
    );

    await client.query(
      `INSERT INTO users (id, username, email, password_hash, display_name, role, avatar_url, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [userId, 'johndoe', 'john@example.com', userPasswordHash, 'John Doe', 'user',
       'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150',
       'Avid reader, soccer fan, and technology enthusiast.']
    );

    const categories = [
      { id: uuidv4(), name: 'Technology', slug: 'technology', description: 'Computing, AI, security, and gadgets.', color: '#0D9488', icon: 'cpu' },
      { id: uuidv4(), name: 'Sports', slug: 'sports', description: 'Football, basketball, athletics updates.', color: '#EA580C', icon: 'trophy' },
      { id: uuidv4(), name: 'Politics', slug: 'politics', description: 'Geopolitics, elections, civic analysis.', color: '#4F46E5', icon: 'landmark' },
      { id: uuidv4(), name: 'Business', slug: 'business', description: 'Markets, macroeconomics, startups.', color: '#0284C7', icon: 'briefcase' },
      { id: uuidv4(), name: 'Entertainment', slug: 'entertainment', description: 'Cinema, music, gaming news.', color: '#C026D3', icon: 'film' },
      { id: uuidv4(), name: 'Science', slug: 'science', description: 'Space, quantum engineering, ecology.', color: '#059669', icon: 'flask-conical' },
      { id: uuidv4(), name: 'Health', slug: 'health', description: 'Neuroscience, wellness, health systems.', color: '#DC2626', icon: 'heart-pulse' },
      { id: uuidv4(), name: 'World', slug: 'world', description: 'Breaking news from all hemispheres.', color: '#7C3AED', icon: 'globe' },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (id, name, slug, description, color, icon) VALUES ($1,$2,$3,$4,$5,$6)`,
        [cat.id, cat.name, cat.slug, cat.description, cat.color, cat.icon]
      );
    }

    const articlesSeed = [
      { categorySlug: 'technology', title: 'The Rise of Quantum Computing: Decrypting Cybersecurity Futures', excerpt: 'Quantum hardware is leaping from labs to mainstream operations.', content: '<p>Quantum computing content here.</p>', cover_image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800', views: 3412 },
      { categorySlug: 'technology', title: 'Generative AI at Work: The Dawn of the Centaur Employee', excerpt: 'Integrating AI engines creates hybrid workers who excel in output.', content: '<p>Generative AI content here.</p>', cover_image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=800', views: 1245 },
      { categorySlug: 'sports', title: 'Premier League Title Race: Analytical Breakdowns of the Final Stretch', excerpt: 'Three clubs separated by two points as the tournament reaches its climax.', content: '<p>Premier League content here.</p>', cover_image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800', views: 5210 },
      { categorySlug: 'sports', title: 'Olympic Preparation: Sustainability Meets Athletics in Paris', excerpt: 'Organizers are building an ambitious green framework for the games.', content: '<p>Olympics content here.</p>', cover_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800', views: 940 },
      { categorySlug: 'politics', title: 'Geopolitical Realignment: The New Trade Corridors of Eurasia', excerpt: 'New trade routes are shifting historical supply lines across Eurasian states.', content: '<p>Geopolitics content here.</p>', cover_image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800', views: 2900 },
      { categorySlug: 'politics', title: 'Civic Technology: Can Digital Systems Rebuild Trust in Democracy?', excerpt: 'Municipalities experimenting with blockchain voting and participatory budgeting.', content: '<p>Civic tech content here.</p>', cover_image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=800', views: 1820 },
      { categorySlug: 'business', title: 'The Green Energy Investment Surge: Navigating High Interest Rates', excerpt: 'Clean energy capital allocation continues to reach record figures.', content: '<p>Green energy content here.</p>', cover_image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800', views: 4500 },
      { categorySlug: 'business', title: 'Corporate Remote Work Policies: The Rise of the Structured Hybrid Model', excerpt: 'The debate is settling into a highly structured hybrid compromise.', content: '<p>Remote work content here.</p>', cover_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800', views: 2130 },
      { categorySlug: 'entertainment', title: 'The Independent Cinema Renaissance: How Streaming Fatigue is Filling Art Houses', excerpt: 'Audiences are returning to indie theaters in search of curated screenings.', content: '<p>Cinema content here.</p>', cover_image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800', views: 3100 },
      { categorySlug: 'entertainment', title: 'The Evolution of Narrative Video Games: Interactive Storytelling Reaches Maturity', excerpt: 'Narrative-driven games are challenging cinema as a storytelling medium.', content: '<p>Gaming content here.</p>', cover_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800', views: 1980 },
      { categorySlug: 'science', title: 'A New Era of Astrophysics: James Webb Reveals Early Galaxy Formations', excerpt: 'The telescope is discovering massive galaxies challenging cosmological models.', content: '<p>Astrophysics content here.</p>', cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800', views: 4890 },
      { categorySlug: 'science', title: 'Quantum Teleportation: Pushing the Boundaries of Quantum Communication Networks', excerpt: 'Physicists have successfully teleported quantum information across fiber networks.', content: '<p>Quantum teleportation content here.</p>', cover_image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800', views: 2340 },
      { categorySlug: 'health', title: 'The Neuroscience of Sleep: How Brain Rhythms Flush Metabolic Waste', excerpt: 'Deep non-REM sleep plays a crucial role in clearing harmful toxins.', content: '<p>Sleep neuroscience content here.</p>', cover_image: 'https://images.unsplash.com/photo-1511295742364-92767fa62d9f?q=80&w=800', views: 3900 },
      { categorySlug: 'health', title: 'Precision Nutrition: How Gut Microbiome Sequencing is Personalizing Diets', excerpt: 'The field of dietetics is shifting to personalized food systems.', content: '<p>Nutrition content here.</p>', cover_image: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=800', views: 2980 },
      { categorySlug: 'world', title: 'Global Water Security: Navigating Droughts in Megacities', excerpt: 'Rapid urbanization is forcing major metropolises to redesign water systems.', content: '<p>Water security content here.</p>', cover_image: 'https://images.unsplash.com/photo-1548813730-4f2e9e0979a4?q=80&w=800', views: 3120 },
      { categorySlug: 'world', title: 'The Great Green Wall of Africa: Combatting Desertification', excerpt: 'An ambitious initiative is restoring degraded land across the Sahel region.', content: '<p>Green Wall content here.</p>', cover_image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800', views: 1870 },
    ];

    for (let index = 0; index < articlesSeed.length; index++) {
      const art = articlesSeed[index];
      const category = categories.find(c => c.slug === art.categorySlug);
      if (!category) continue;

      const id = uuidv4();
      const slug = art.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      const createdAt = new Date(Date.now() - index * 86400000).toISOString();

      await client.query(
        `INSERT INTO articles (id, title, slug, excerpt, content, cover_image, category_id, author_id, views, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, art.title, slug, art.excerpt, art.content, art.cover_image, category.id, adminId, art.views, createdAt]
      );

      await client.query(
        `INSERT INTO comments (id, article_id, user_id, content, created_at) VALUES ($1,$2,$3,$4,$5)`,
        [uuidv4(), id, userId, 'Great article! Very informative.', createdAt]
      );

      if (index % 3 === 0) {
        await client.query(
          `INSERT INTO comments (id, article_id, user_id, content, created_at) VALUES ($1,$2,$3,$4,$5)`,
          [uuidv4(), id, adminId, 'Thank you for reading!', createdAt]
        );
        await client.query(
          `INSERT INTO bookmarks (id, user_id, article_id) VALUES ($1,$2,$3)`,
          [uuidv4(), userId, id]
        );
        await client.query(
          `INSERT INTO likes (id, user_id, article_id) VALUES ($1,$2,$3)`,
          [uuidv4(), userId, id]
        );
      }
    }

    console.log('Seeding successfully completed!');
  } finally {
    client.release();
  }
}

initializeDatabase().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

module.exports = pool;