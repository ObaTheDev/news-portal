const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Ensure database directory exists
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'news-portal.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at TEXT DEFAULT (datetime('now'))
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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, article_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, article_id)
  );
`);

// Seed data helper
const seed = () => {
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount > 0) {
    console.log('Database already initialized with data.');
    return;
  }

  console.log('Seeding fresh database with sample editorial entries...');

  // Seed Users
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const userPasswordHash = bcrypt.hashSync('user123', 10);
  
  const adminId = uuidv4();
  const userId = uuidv4();

  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, display_name, role, avatar_url, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'admin',
    'admin@newsportal.com',
    adminPasswordHash,
    'Sarah Jenkins',
    'admin',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150',
    'Senior Editorial Director at The Daily Digest. Covering global geopolitical developments and tech breakthroughs.'
  );

  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, display_name, role, avatar_url, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    'johndoe',
    'john@example.com',
    userPasswordHash,
    'John Doe',
    'user',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150',
    'Avid reader, soccer fan, and technology enthusiast.'
  );

  // Seed Categories
  const categories = [
    { id: uuidv4(), name: 'Technology', slug: 'technology', description: 'Computing, artificial intelligence, security, and consumer gadgets.', color: '#0D9488', icon: 'cpu' },
    { id: uuidv4(), name: 'Sports', slug: 'sports', description: 'Football, basketball, athletics, and global championship updates.', color: '#EA580C', icon: 'trophy' },
    { id: uuidv4(), name: 'Politics', slug: 'politics', description: 'Geopolitics, legislative actions, elections, and civic analysis.', color: '#4F46E5', icon: 'landmark' },
    { id: uuidv4(), name: 'Business', slug: 'business', description: 'Global markets, macroeconomic policy, startups, and corporate tech.', color: '#0284C7', icon: 'briefcase' },
    { id: uuidv4(), name: 'Entertainment', slug: 'entertainment', description: 'Cinema, music culture, gaming news, and celebrity reviews.', color: '#C026D3', icon: 'film' },
    { id: uuidv4(), name: 'Science', slug: 'science', description: 'Space exploration, quantum engineering, astrophysics, and clinical ecology.', color: '#059669', icon: 'flask-conical' },
    { id: uuidv4(), name: 'Health', slug: 'health', description: 'Neuroscience developments, wellness routines, health systems, and pandemics.', color: '#DC2626', icon: 'heart-pulse' },
    { id: uuidv4(), name: 'World', slug: 'world', description: 'Breaking news bulletins and stories from all hemispheres.', color: '#7C3AED', icon: 'globe' },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, description, color, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  categories.forEach(cat => {
    insertCategory.run(cat.id, cat.name, cat.slug, cat.description, cat.color, cat.icon);
  });

  // Seed 16 Articles (2 per category)
  const articlesSeed = [
    {
      categorySlug: 'technology',
      title: 'The Rise of Quantum Computing: Decrypting Cybersecurity Futures',
      excerpt: 'Quantum hardware is leaping from labs to mainstream operations, posing severe threats to existing digital cryptography systems.',
      content: `
        <p>Over the past decade, quantum computing has occupied a comfortable niche in theoretical physics laboratories. However, recent milestones from technology giants and research consortia indicate that practical, fault-tolerant quantum computers are closer than previously estimated. This technological acceleration brings remarkable computational promises but also harbinger severe disruptions for global digital security infrastructure.</p>
        <h2>The Quantum Cryptographic Threat</h2>
        <p>At the center of current web security is public-key cryptography—specifically RSA and ECC systems. These mechanisms safeguard banking logs, government records, and personal chat histories. They remain secure because decomposing massive prime factors is computationally impossible for traditional microchips, requiring thousands of years to crack. A quantum system using Shor's algorithm, however, can bypass this calculation in minutes.</p>
        <blockquote>"The cryptographic foundation upon which the modern internet is built will collapse if we do not migrate to quantum-resistant standards before quantum superiority is unlocked."</blockquote>
        <h2>Transitioning to Post-Quantum Standards</h2>
        <p>National cyber defense agencies are urging instant transition planning. The National Institute of Standards and Technology (NIST) has already finalized standardizations for four quantum-resistant encryption algorithms designed to withstand attacks from both quantum and classical machines. Organizations are advised to audit their data pipelines immediately to swap out vulnerable keys.</p>
        <h2>Looking Ahead</h2>
        <p>Transitioning security networks is a decade-long project. Major software platforms and browser engines are already experimenting with hybrid cryptographic suites. As quantum computers grow from experimental mainframes to commercial cloud utilities, the race to lock down databases before hackers build quantum decryptors remains the most pressing digital challenge of our era.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800',
      views: 3412
    },
    {
      categorySlug: 'technology',
      title: 'Generative AI at Work: The Dawn of the Centaur Employee',
      excerpt: 'A new wave of collaborative productivity studies suggests that integrating AI engines creates specialized hybrid workers who excel in corporate output.',
      content: `
        <p>As generative artificial intelligence moves past early novelties, researchers are studying its measurable impact on white-collar performance. Initial reports indicate a fascinating evolution: the most successful workers are not those replacing their tasks entirely with AI, but "centaur" employees who seamlessly fuse human intuition with machine computational power.</p>
        <h2>Redefining Daily Outputs</h2>
        <p>In extensive trials analyzing consultants, writers, and software coders, those equipped with generative assistants finished tasks 25% faster and produced outputs rated 40% higher in quality than non-assisted colleagues. The engines handle background research, synthesis, and early drafts, leaving professionals free to focus on editing, strategic architecture, and nuanced application.</p>
        <blockquote>"Centaur employees treat AI as an intellectual bicycle. They do not let the machine ride for them; they use it to cycle twice as far on the same energy reserves."</blockquote>
        <h2>Skill Level Equalization</h2>
        <p>Perhaps the most encouraging result is that generative AI acts as a great equalizer. The largest performance leaps occurred in bottom-tier writers and junior developers. The technology offsets learning curves, elevating new employees to high-tier averages in record time, while top-tier experts enjoy smaller gains but greater strategic bandwidth.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=800',
      views: 1245
    },
    {
      categorySlug: 'sports',
      title: 'Premier League Title Race: Analytical Breakdowns of the Final Stretch',
      excerpt: 'With three clubs separated by only two points as the tournament reaches its climax, computational metrics reveal the narrowest championship run in a decade.',
      content: `
        <p>The English Premier League is witnessing an extraordinary championship finale. Three clubs—Arsenal, Manchester City, and Liverpool—are locked in an intense battle, separated by a single victory margins with less than six fixtures remaining. Football analysts are resorting to computer models to weigh squad depth, historical trends, and injury lists in an attempt to predict the champion.</p>
        <h2>Tactical Evolutions and Bench Depth</h2>
        <p>Unlike previous seasons where a single dominant tactical philosophy prevailed, this season presents three distinct approaches. Manchester City continues their precise, high-possession geometry. Arsenal displays a highly disciplined defensive block paired with clinical set-piece executions. Liverpool relies on intense, heavy-metal pressing and rapid transitions.</p>
        <blockquote>"This isn't just a contest of footballers; it's a battle of managerial philosophies tested by extreme physical exhaustion."</blockquote>
        <h2>The Impact of the Packed Calendar</h2>
        <p>With UEFA fixtures and domestic cups filling mid-week schedules, muscle fatigue and squad rotations will decide the final winner. Computer simulators currently favor Manchester City by a slim 38% probability, citing their deep squad depth and championship experience, with Arsenal and Liverpool following closely at 32% and 30% respectively.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
      views: 5210
    },
    {
      categorySlug: 'sports',
      title: 'Olympic Preparation: Sustainability Meets Athletics in Paris',
      excerpt: 'Organizers are building an ambitious green framework for the games, aiming to halve carbon footprints compared to previous events.',
      content: `
        <p>The upcoming Summer Olympic Games are attempting to make history before any athlete enters the stadium. The Paris organizing committee has pledged a highly ambitious ecological roadmap: to host the most sustainable games in modern history, aiming to cut emissions in half compared to the London and Rio games.</p>
        <h2>Reusable Infrastructure and Smart Logistics</h2>
        <p>Rather than constructing massive, expensive new stadiums destined to become abandoned white elephants, organizers are using 95% existing or temporary facilities. The Olympic Village is constructed from wood and bio-sourced materials, designed to be converted into residential apartments post-games. The venue will be powered by geothermal and solar arrays.</p>
        <blockquote>"The games must demonstrate that high-performance athletics do not require high carbon footprints."</blockquote>
        <h2>A Template for Future Events</h2>
        <p>The Paris framework could redefine how massive international events are managed. From locally sourced, plant-forward catering menus for athletes to expansive bicycle lanes linking venues, the games will show whether green policies can succeed on the largest sporting stage.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800',
      views: 940
    },
    {
      categorySlug: 'politics',
      title: 'Geopolitical Realignment: The New Trade Corridors of Eurasia',
      excerpt: 'Emerging bilateral alliances and infrastructure corridors are shifting historical supply lines across Eurasian states.',
      content: `
        <p>A quiet revolution is happening across the geography of Eurasia. Driven by supply chain vulnerabilities, sanctions, and resource demands, a web of new trade routes, rail systems, and sea corridors is emerging. These developments are shifting the balance of economic and political influence away from traditional maritime routes to continental pipelines.</p>
        <h2>The Middle Corridor Ascendancy</h2>
        <p>Central to this realignment is the Middle Corridor—a trade link connecting Central Asia, the Caspian Sea, and Turkey to European hubs, bypassing northern routes. Multi-billion dollar rail expansions and deep-water port upgrades are converting historic Silk Road posts into highly automated cargo centers.</p>
        <blockquote>"The states that control the junctions of these continental rails will wield significant geopolitical leverage over Eurasian trade in the coming decades."</blockquote>
        <h2>Mineral Diplomacy</h2>
        <p>The realignment is deeply fueled by the global transition to clean energy. Eurasian states are leveraging their abundant reserves of copper, nickel, and rare earth minerals to negotiate favorable diplomatic agreements, securing long-term developmental support in exchange for resource extraction access.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800',
      views: 2900
    },
    {
      categorySlug: 'politics',
      title: 'Civic Technology: Can Digital Systems Rebuild Trust in Democracy?',
      excerpt: 'Municipalities around the globe are experimenting with blockchain voting and participatory budgeting to encourage citizen engagement.',
      content: `
        <p>Amid declining civic participation and trust in legislative bodies, a counter-movement is taking root at the local government level. Cities from Helsinki to Taipei are deploying civic tech applications designed to involve citizens directly in budget allocations, planning approvals, and policy creation.</p>
        <h2>Participatory Budgeting in Action</h2>
        <p>Through dedicated digital portals, residents can submit neighborhood improvement projects, discuss them with fellow citizens, and vote directly on municipal budget allocations. This transparent, direct democracy loop bypasses traditional red tape, showing citizens that their voices have immediate, visible results.</p>
        <blockquote>"Civic tech isn't about replacing representatives; it's about closing the feedback loop between citizens and state halls."</blockquote>
        <h2>Security and Verification</h2>
        <p>Ensuring secure, anonymous participation remains a key challenge. Developers are integrating advanced zero-knowledge proof cryptography to verify residency and count votes without compromising personal user data. These projects demonstrate how technology can strengthen, rather than disrupt, democratic institutions.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=800',
      views: 1820
    },
    {
      categorySlug: 'business',
      title: 'The Green Energy Investment Surge: Navigating High Interest Rates',
      excerpt: 'Clean energy capital allocation continues to reach record figures despite tightening credit and central bank interest rate pressure.',
      content: `
        <p>Global financial systems are undergoing a historic transformation. Despite high interest rates from central banks, investment in renewable energy generation, energy storage infrastructure, and green transition startups is reaching unprecedented highs. Financial markets are prioritizing long-term climate resilient assets over volatile legacy portfolios.</p>
        <h2>Capital Redirection and Government Subsidies</h2>
        <p>This investment surge is significantly driven by robust government policy frameworks, such as the Inflation Reduction Act in the United States and the Green Deal in the European Union. These programs provide reliable, long-term tax credits and capital guarantees, making renewable projects highly attractive to institutional investors despite high debt costs.</p>
        <blockquote>"Sustainability is no longer a corporate social responsibility project; it is the most competitive, high-yield investment thesis of the 21st century."</blockquote>
        <h2>The Growth of Grid-Scale Battery Systems</h2>
        <p>As wind and solar capacity grows, capital is rapidly shifting to battery storage. Building grid-scale battery systems is crucial to stabilize grids during periods of low generation. Investment in energy storage projects grew by 60% over the last fiscal year, demonstrating that energy transition finance has entered a highly mature commercial phase.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800',
      views: 4500
    },
    {
      categorySlug: 'business',
      title: 'Corporate Remote Work Policies: The Rise of the Structured Hybrid model',
      excerpt: 'The debate between full return-to-office mandates and complete remote work is settling into a highly structured hybrid compromise.',
      content: `
        <p>After years of rapid pivots, corporate giants are finally settling on permanent workspace policies. The extreme poles—five-day return-to-office mandates on one side and fully remote arrangements on the other—are giving way to a structured hybrid model designed to balance collaboration with employee flexibility.</p>
        <h2>The Structured Hybrid Formula</h2>
        <p>The standard hybrid model consists of designated core collaboration days (usually Tuesday through Thursday) combined with remote flexibility on Monday and Friday. Companies are redesigning office layouts, replacing individual cubicles with spacious collaborative lounges and dynamic hot-desking setups.</p>
        <blockquote>"The goal is simple: make the office a destination for teamwork, rather than a place for individual screen time."</blockquote>
        <h2>Retention and Talent Acquisition</h2>
        <p>Retaining top talent is a major driver of hybrid policies. Surveys indicate that over 65% of professionals would search for another job if forced back to the office full-time. Companies that offer structured flexibility are enjoying higher employee retention and broader talent recruitment pools.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800',
      views: 2130
    },
    {
      categorySlug: 'entertainment',
      title: 'The Independent Cinema Renaissance: How Streaming Fatigue is Filling Art Houses',
      excerpt: 'Audiences are returning to indie theaters in search of curated communal screenings, moving away from infinite streaming feeds.',
      content: `
        <p>For years, independent cinema owners feared that the rise of streaming platforms would spell their demise. However, the opposite trend is emerging: streaming fatigue, fueled by rising subscription costs and algorithmic recommendations, is driving audiences back to independent art-house theaters in search of curated, communal cinematic experiences.</p>
        <h2>Curated Programming and Event Cinema</h2>
        <p>The success of independent theaters lies in their creative programming. Rather than relying solely on blockbusters, art houses offer curated retrospectives, local filmmaker showcases, and Q&A sessions. These theaters are transformed into cultural hubs, featuring cafes, bookshops, and social lounges.</p>
        <blockquote>"People don't just want to watch a film; they want a shared cultural experience that algorithm-driven screens cannot provide."</blockquote>
        <h2>The Rise of Independent Distributors</h2>
        <p>Independent distributors are capitalizing on this resurgence. By focusing on highly original, daring stories from diverse international creators, these companies are building dedicated fanbases. Their films are enjoying extended theatrical runs and strong word-of-mouth success.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800',
      views: 3100
    },
    {
      categorySlug: 'entertainment',
      title: 'The Evolution of Narrative Video Games: Interactive Storytelling Reaches Maturity',
      excerpt: 'Modern narrative-driven games are challenging traditional cinema as the premier medium for complex storytelling.',
      content: `
        <p>The boundaries between interactive entertainment and traditional cinema are rapidly blurring. A new wave of narrative-focused video games is achieving critical acclaim, using advanced real-time rendering, performance capture, and player choice to deliver complex stories that rival the finest literature.</p>
        <h2>Interactive Storytelling Dynamics</h2>
        <p>Unlike film where the audience is a passive observer, narrative games place players in control. Player decisions dynamically branch storylines, forcing players to grapple with moral dilemmas and personal consequences. This interactive agency builds a deep, empathetic connection to characters.</p>
        <blockquote>"In a film, you watch a character make a choice. In a game, you must make that choice yourself, and live with the virtual consequences."</blockquote>
        <h2>Cultural Recognition</h2>
        <p>Prestigious film festivals are recognizing this evolution, introducing dedicated interactive narrative categories. As the medium matures, it is attracting top-tier writers, directors, and actors, securing its place as a premier storytelling medium of the 21st century.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800',
      views: 1980
    },
    {
      categorySlug: 'science',
      title: 'A New Era of Astrophysics: James Webb Reveals Early Galaxy Formations',
      excerpt: 'The telescope is discovering massive, mature galaxies that challenge current cosmological models of the early universe.',
      content: `
        <p>The James Webb Space Telescope (JWST) is rewriting our understanding of the cosmos. By peer-imaging deep into the infrared spectrum, the telescope is capturing light from the universe's infancy, revealing the presence of massive, highly organized galaxies existing just a few hundred million years after the Big Bang.</p>
        <h2>Challenging Cosmological Models</h2>
        <p>According to previous cosmological consensus, early galaxies should have been small, chaotic clumps of gas and stars. JWST is discovering mature, disk-shaped galaxies that seem to have evolved at an incredibly rapid pace. This finding is prompting astrophysicists to revise their theories on early star formation rates.</p>
        <blockquote>"These discoveries are forcing us to reconsider our assumptions about the speed at which matter coalesced in the early universe."</blockquote>
        <h2>Analyzing Planetary Atmospheres</h2>
        <p>Webb is also making strides closer to home, analyzing the atmospheric compositions of nearby exoplanets. By detecting carbon dioxide, water vapor, and methane on distant worlds, the telescope is helping researchers identify planets that could support habitable environments.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800',
      views: 4890
    },
    {
      categorySlug: 'science',
      title: 'Quantum Teleportation: Pushing the Boundaries of Quantum Communication networks',
      excerpt: 'Physicists have successfully teleported quantum information across several kilometers of optical fiber networks.',
      content: `
        <p>In a significant milestone for quantum information science, physicists have achieved stable quantum teleportation of photon states across several kilometers of standard municipal optical fiber networks. This development brings us closer to a secure, unhackable quantum internet.</p>
        <h2>Quantum Entanglement in Action</h2>
        <p>Quantum teleportation does not move physical matter, but transfers quantum information instantly between two entangled particles, regardless of distance. By successfully transmitting these states through standard fiber optics, researchers have demonstrated that quantum networks can integrate with existing infrastructure.</p>
        <blockquote>"We are laying the foundation for quantum cryptography networks that are physically impossible to intercept without detection."</blockquote>
        <h2>Securing Future Communications</h2>
        <p>A quantum communication network relies on the principles of quantum physics to encrypt data. Any attempt to intercept or measure the transmitted information instantly disrupts the quantum state, alerting the sender and receiver. This technology will secure critical infrastructure, banking, and government networks.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800',
      views: 2340
    },
    {
      categorySlug: 'health',
      title: 'The Neuroscience of Sleep: How Brain Rhythms Flush Metabolic Waste',
      excerpt: 'Recent clinical research demonstrates how deep non-REM sleep plays a crucial role in clearing harmful toxins linked to neurodegeneration.',
      content: `
        <p>Sleep has long been understood as a period of physical recovery. However, recent clinical studies in neuroscience are revealing a dynamic cleansing process that occurs within the brain during deep, non-REM sleep. This process clears metabolic waste products, including amyloid-beta proteins associated with cognitive decline.</p>
        <h2>The Glymphatic Cleansing System</h2>
        <p>During deep sleep, the brain's glial cells shrink, allowing cerebrospinal fluid to rush through the brain tissue like a high-speed flushing system. This glymphatic system washes away metabolic waste accumulated during waking hours when the brain is active.</p>
        <blockquote>"Deep sleep is not a passive state; it is a highly active, crucial cleaning phase for your neural health."</blockquote>
        <h2>Implications for Cognitive Longevity</h2>
        <p>This discovery highlights the importance of sleep quality for long-term health. Chronic sleep deprivation may hinder this cleansing process, contributing to cognitive decline. Researchers are developing therapies to encourage deep sleep stages, aiming to mitigate cognitive decline in high-risk populations.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1511295742364-92767fa62d9f?q=80&w=800',
      views: 3900
    },
    {
      categorySlug: 'health',
      title: 'Precision Nutrition: How Gut Microbiome Sequencing is Personalizing Diets',
      excerpt: 'The field of dietetics is shifting away from generic dietary plans to highly personalized food systems based on genetic and microbiome profiles.',
      content: `
        <p>For decades, nutritional science relied on generic guidelines, such as standard food pyramids and calorie counts. However, as dna sequencing and microbiome analysis become accessible, the medical community is shifting to precision nutrition—customized food systems designed for an individual's unique biological profile.</p>
        <h2>Microbiome Diversity and Glucose Response</h2>
        <p>Clinical trials show that two individuals consuming the exact same meal can display wildly different blood glucose and metabolic responses. These variations are largely driven by the gut microbiome—the diverse community of microbes residing in the digestive tract. Precision nutrition models analyze these microbiomes to recommend tailored foods.</p>
        <blockquote>"There is no single perfect human diet. The future of nutrition is highly personal, coded in your gut microbiome."</blockquote>
        <h2>Navigating the Commercial Landscape</h2>
        <p>A growing wave of health startups offers home testing kits, providing customized dietary reports based on stool and blood samples. While the science is evolving, clinical experts emphasize the importance of consulting medical practitioners to ensure reports translate to safe, balanced wellness systems.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=800',
      views: 2980
    },
    {
      categorySlug: 'world',
      title: 'Global Water Security: Navigating Droughts in Megacities',
      excerpt: 'Rapid urbanization combined with changing climate patterns is forcing major metropolises to completely redesign water management systems.',
      content: `
        <p>Water scarcity is rapidly becoming the defining civic challenge for megacities. From Cape Town to Mexico City, rapid population growth combined with shifting weather patterns is depleting historical aquifers and reservoirs. Cities are investing in advanced recycling, desalination, and digital leak detection to secure municipal water resources.</p>
        <h2>Advanced Water Recycling</h2>
        <p>A key solution is advanced wastewater recycling—treating municipal wastewater to pristine drinking standards. Often referred to as "toilet-to-tap" recycling, this closed-loop system is highly reliable, providing cities with water resources independent of rainfall patterns.</p>
        <blockquote>"Megacities must treat water as a finite, precious asset, moving away from wasteful linear consumption to circular systems."</blockquote>
        <h2>desalination Innovations</h2>
        <p>Coastal megacities are investing in desalination plants to convert seawater to freshwater. While traditionally energy-intensive and expensive, new membrane technologies and renewable-powered facilities are lowering costs and carbon footprints, making desalination a viable water security foundation.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1548813730-4f2e9e0979a4?q=80&w=800',
      views: 3120
    },
    {
      categorySlug: 'world',
      title: 'The Great Green Wall of Africa: Combatting Desertification',
      excerpt: 'An ambitious multi-national initiative is successfully restoring degraded land across the Sahel region, combatting climate change and poverty.',
      content: `
        <p>Spanning the entire width of the African continent, the Great Green Wall is an ambitious initiative aiming to grow a massive corridor of trees and vegetation across the Sahel region. This project combats desertification—the spread of desert conditions into arable land—while restoring ecosystems and creating jobs.</p>
        <h2>Community-Led Agroforestry</h2>
        <p>The success of the Green Wall lies in its community-first approach. Rather than planting massive monoculture tree farms, local communities are trained in agroforestry—integrating native trees with food crops. This approach improves soil health, retains water, and provides communities with reliable food resources and jobs.</p>
        <blockquote>"The wall is not just a barrier against the desert; it is a catalyst for ecological restoration, food security, and regional stability."</blockquote>
        <h2>Carbon Sequestration Potential</h2>
        <p>The initiative also has significant global climate benefits, sequestering millions of tons of carbon dioxide as vegetation grows. International organizations are pledging support to expand the wall, demonstrating that nature-based solutions can address complex ecological and developmental challenges simultaneously.</p>
      `,
      cover_image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800',
      views: 1870
    }
  ];

  const insertArticle = db.prepare(`
    INSERT INTO articles (id, title, slug, excerpt, content, cover_image, category_id, author_id, views, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  articlesSeed.forEach((art, index) => {
    const category = categories.find(c => c.slug === art.categorySlug);
    if (!category) return;

    const id = uuidv4();
    const slug = art.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    // Spread publication dates slightly into past (e.g., -1 day, -2 days)
    const dateOffset = `-${index} day`;
    
    insertArticle.run(
      id,
      art.title,
      slug,
      art.excerpt,
      art.content.trim(),
      art.cover_image,
      category.id,
      adminId,
      art.views,
      dateOffset
    );

    // Seed some comments on articles
    const commentId1 = uuidv4();
    db.prepare(`
      INSERT INTO comments (id, article_id, user_id, content, created_at)
      VALUES (?, ?, ?, ?, datetime('now', ?))
    `).run(
      commentId1,
      id,
      userId,
      `Incredible reporting! The section explaining Shor's algorithm and the vulnerabilities of RSA was extremely clear. I am looking forward to seeing how fast companies adapt.`,
      `-${index} day`
    );

    // Add a second comment on every third article
    if (index % 3 === 0) {
      const commentId2 = uuidv4();
      db.prepare(`
        INSERT INTO comments (id, article_id, user_id, content, created_at)
        VALUES (?, ?, ?, ?, datetime('now', ?))
      `).run(
        commentId2,
        id,
        adminId,
        `Thank you for reading! As an editor, I cannot stress enough how vital cybersecurity adaptation is for the next decade.`,
        `-${index} day`
      );

      // Add bookmark
      db.prepare(`
        INSERT INTO bookmarks (id, user_id, article_id, created_at)
        VALUES (?, ?, ?, datetime('now', ?))
      `).run(uuidv4(), userId, id, `-${index} day`);

      // Add like
      db.prepare(`
        INSERT INTO likes (id, user_id, article_id, created_at)
        VALUES (?, ?, ?, datetime('now', ?))
      `).run(uuidv4(), userId, id, `-${index} day`);
    }
  });

  console.log('Seeding successfully completed!');
};

// Perform Seeding
seed();

module.exports = db;
