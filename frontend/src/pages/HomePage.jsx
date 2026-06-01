import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../utils/api';
import ArticleCard from '../components/ArticleCard';
import { FeaturedSkeleton, CardSkeleton } from '../components/Skeleton';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [recommendedArticles, setRecommendedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load categories
        const catRes = await api.get('/api/categories');
        setCategories(catRes.categories || []);

        // Load trending articles
        const trendingRes = await api.get('/api/articles?sort=trending&limit=6');
        const trendingData = trendingRes.articles || [];
        setTrendingArticles(trendingData);

        // Load latest articles
        const latestRes = await api.get('/api/articles?limit=10');
        const latestData = latestRes.articles || [];

        if (latestData.length > 0) {
          setFeaturedArticle(latestData[0]);
          setLatestArticles(latestData.slice(1));
        }

        // Load recommended if authenticated
        if (isAuthenticated) {
          try {
            const recRes = await api.get('/api/articles?sort=popular&limit=3');
            setRecommendedArticles(recRes.articles || []);
          } catch (e) {
            console.error('Failed to load recommendations', e);
          }
        }
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  return (
    <div>
      {/* Trending Bar */}
      {trendingArticles.length > 0 && (
        <div className="trending-bar">
          <div className="container trending-bar-inner">
            <span className="trending-label">
              <TrendingUp size={14} /> Trending
            </span>
            <div className="trending-items">
              {trendingArticles.map((article, idx) => (
                <Link key={article.id} to={`/article/${article.slug}`} className="trending-item">
                  <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-accent)', marginRight: '6px' }}>
                    {idx + 1}
                  </span>
                  {article.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container" style={{ marginTop: '32px' }}>
        <div className="layout-with-sidebar">
          {/* Main Content Area */}
          <div>
            {/* Featured Section */}
            <section style={{ marginBottom: '48px' }}>
              <div className="section-header">
                <h2 className="section-title">Featured Story</h2>
              </div>
              {loading ? (
                <FeaturedSkeleton />
              ) : featuredArticle ? (
                <ArticleCard article={featuredArticle} variant="featured" />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon"><BookOpen size={48} /></div>
                  <h3 className="empty-state-title">No articles available</h3>
                  <p className="empty-state-text">Check back later for fresh updates!</p>
                </div>
              )}
            </section>

            {/* Categories Section */}
            <section style={{ marginBottom: '48px' }}>
              <div className="section-header">
                <h2 className="section-title">Explore Categories</h2>
              </div>
              <div className="category-grid">
                {categories.map(cat => (
                  <Link key={cat.id} to={`/category/${cat.slug}`} className="category-card">
                    <div 
                      className="category-card-icon"
                      style={{ 
                        background: `rgba(var(--color-${cat.slug}), 0.1)`, 
                        color: `var(--color-cat-${cat.slug})` 
                      }}
                    >
                      <BookOpen size={20} />
                    </div>
                    <div className="category-card-name">{cat.name}</div>
                    <div className="category-card-count">{cat.article_count || 0} articles</div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Latest News Grid */}
            <section>
              <div className="section-header">
                <h2 className="section-title">Latest Updates</h2>
              </div>
              {loading ? (
                <div className="article-grid">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : latestArticles.length > 0 ? (
                <div className="article-grid">
                  {latestArticles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                !featuredArticle && (
                  <div className="empty-state">
                    <h3 className="empty-state-title">No articles found</h3>
                  </div>
                )
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Recommendations Section for Authenticated Users */}
            {isAuthenticated && recommendedArticles.length > 0 && (
              <div className="card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-bold)' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-accent)' }} /> Handpicked for You
                </h3>
                <div className="article-list">
                  {recommendedArticles.map(article => (
                    <Link 
                      key={article.id} 
                      to={`/article/${article.slug}`}
                      style={{ display: 'block', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-light)' }}
                    >
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: '6px', lineHeight: 'var(--leading-tight)' }}>
                        {article.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                        <span>{article.category_name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Heart size={10} fill="var(--color-error)" style={{ color: 'var(--color-error)' }} /> {article.like_count || 0}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending / Popular List */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '20px', fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-bold)' }}>
                Most Discussed
              </h3>
              <div className="article-list">
                {trendingArticles.slice(0, 5).map((article, idx) => (
                  <div key={article.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', lineHeight: '1' }}>
                      0{idx + 1}
                    </span>
                    <div>
                      <Link to={`/article/${article.slug}`}>
                        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: '6px', lineHeight: 'var(--leading-tight)' }}>
                          {article.title}
                        </h4>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                        <span>{article.category_name}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Eye size={10} /> {article.views}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
