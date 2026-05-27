import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Clock, Newspaper } from 'lucide-react';
import { api } from '../utils/api';
import ArticleCard from '../components/ArticleCard';
import { CardSkeleton } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { showToast } = useToast();
  const limit = 9;

  useEffect(() => {
    // Reset pagination when category or sort changes
    setPage(1);
  }, [slug, sortBy]);

  useEffect(() => {
    const fetchCategoryAndArticles = async () => {
      setLoading(true);
      try {
        // Find category metadata by listing all categories and finding matches
        const cats = await api.get('/api/categories');
        const currentCat = (cats.data || []).find(c => c.slug.toLowerCase() === slug.toLowerCase());
        
        if (currentCat) {
          setCategory(currentCat);
        } else {
          setCategory({ name: slug.charAt(0).toUpperCase() + slug.slice(1), slug });
        }

        // Fetch paginated, sorted articles for this category
        const articlesRes = await api.get(
          `/api/articles?category=${slug}&sort=${sortBy}&page=${page}&limit=${limit}`
        );
        
        if (articlesRes.success) {
          setArticles(articlesRes.data || []);
          setTotalPages(articlesRes.pagination?.totalPages || 1);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load category feed', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndArticles();
  }, [slug, sortBy, page, showToast]);

  return (
    <div className="container" style={{ marginTop: '32px' }}>
      {/* Category Header */}
      {category && (
        <div 
          className="page-header" 
          style={{ 
            borderBottom: '1.5px solid var(--color-border)', 
            paddingBottom: '24px', 
            marginBottom: '32px',
            position: 'relative' 
          }}
        >
          <div 
            style={{ 
              position: 'absolute', 
              left: 0, 
              bottom: '-1.5px', 
              width: '80px', 
              height: '3px', 
              background: `var(--color-cat-${category.slug.toLowerCase()})` || 'var(--color-accent)', 
              borderRadius: 'var(--radius-full)'
            }}
          ></div>
          <h1 className="page-title" style={{ textTransform: 'capitalize' }}>
            {category.name}
          </h1>
          <p className="page-subtitle">
            {category.description || `Browse the latest editorial coverage on ${category.name}`}
          </p>
        </div>
      )}

      {/* Sorting bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}
      >
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
          {articles.length} {articles.length === 1 ? 'article' : 'articles'} in this feed
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>
            Sort By:
          </label>
          <select 
            className="form-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '160px', padding: '6px 32px 6px 12px', fontSize: 'var(--text-sm)', borderRadius: '20px' }}
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending Now</option>
          </select>
        </div>
      </div>

      {/* Feed Grid */}
      {loading ? (
        <div className="article-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : articles.length > 0 ? (
        <>
          <div className="article-grid">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button 
                  key={idx} 
                  className={`pagination-btn ${page === idx + 1 ? 'active' : ''}`}
                  onClick={() => setPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button 
                className="pagination-btn" 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><Newspaper size={48} /></div>
          <h3 className="empty-state-title">Feed is empty</h3>
          <p className="empty-state-text">No articles found in this category yet.</p>
        </div>
      )}
    </div>
  );
}
