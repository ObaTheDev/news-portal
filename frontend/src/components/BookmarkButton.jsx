import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function BookmarkButton({ articleId, initialBookmarked = false, onToggle, size = 18 }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    setBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please log in to bookmark articles', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/api/bookmarks/${articleId}`);
      setBookmarked(res.bookmarked);
      showToast(
        res.bookmarked ? 'Article bookmarked' : 'Bookmark removed',
        'success'
      );
      if (onToggle) onToggle(res.bookmarked);
    } catch (err) {
      showToast(err.message || 'Failed to update bookmark', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`action-btn ${bookmarked ? 'bookmarked' : ''}`}
      onClick={handleToggle}
      disabled={loading}
      title={bookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
      style={{ display: 'inline-flex', padding: '6px', borderRadius: '50%' }}
    >
      <Bookmark
        size={size}
        fill={bookmarked ? 'currentColor' : 'none'}
        style={{
          transition: 'transform var(--transition-spring)',
          transform: loading ? 'scale(0.85)' : 'scale(1)',
        }}
      />
    </button>
  );
}
