import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../utils/api';
import ArticleCard from '../components/ArticleCard';
import { CardSkeleton } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(query);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { showToast } = useToast();
  const limit = 9;

  useEffect(() => {
    setInputValue(query);
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setArticles([]);
      setTotalPages(1);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/api/articles?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
        );
        if (res.success) {
          setArticles(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } catch (err) {
        showToast(err.message || 'Search request failed', 'error');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, page, showToast]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  return (
    <div className="container" style={{ marginTop: '32px' }}>
      {/* Search Header Form */}
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <h1 className="page-title" style={{ marginBottom: '20px' }}>Search Articles</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search by title or content keywords..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px', borderRadius: '30px' }}
              required
            />
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--color-text-tertiary)' 
              }} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ borderRadius: '30px', padding: '0 24px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Results details */}
      {query && (
        <div style={{ marginBottom: '24px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          {loading ? (
            <span>Searching...</span>
          ) : (
            <span>
              Found {articles.length} {articles.length === 1 ? 'result' : 'results'} for &ldquo;<strong>{query}</strong>&rdquo;
            </span>
          )}
        </div>
      )}

      {/* Grid of Results */}
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
        query && (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={48} /></div>
            <h3 className="empty-state-title">No matches found</h3>
            <p className="empty-state-text">
              Try adjusting your query or exploring our primary categories instead.
            </p>
          </div>
        )
      )}
    </div>
  );
}
