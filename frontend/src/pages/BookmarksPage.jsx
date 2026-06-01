import React, { useState, useEffect } from 'react';
import { Bookmark, Sparkles } from 'lucide-react';
import { api } from '../utils/api';
import ArticleCard from '../components/ArticleCard';
import { CardSkeleton } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/api/bookmarks');
      if (res.success) {
        // Bookmarks endpoint returns full article details, let's inject bookmarked: true manually
        const items = (res.bookmarks || []).map(item => ({ ...item, bookmarked: true }));
        setBookmarks(items);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch bookmarks list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = (articleId, isBookmarked) => {
    // If user untoggled bookmark, fade out the card from the list
    if (!isBookmarked) {
      setBookmarks(prev => prev.filter(item => item.id !== articleId));
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '32px' }}>
      <div className="page-header" style={{ borderBottom: '1.5px solid var(--color-border)', paddingBottom: '20px', marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bookmark size={32} style={{ color: 'var(--color-accent)' }} /> My Bookmarks
        </h1>
        <p className="page-subtitle">Manage your saved articles and reading list</p>
      </div>

      {loading ? (
        <div className="article-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="article-grid">
          {bookmarks.map(article => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              onBookmarkToggle={(isBookmarked) => handleBookmarkToggle(article.id, isBookmarked)} 
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Bookmark size={36} />
          </div>
          <h3 className="empty-state-title">No saved stories</h3>
          <p className="empty-state-text">
            Articles you bookmark will appear here for you to read and enjoy later.
          </p>
        </div>
      )}
    </div>
  );
}
