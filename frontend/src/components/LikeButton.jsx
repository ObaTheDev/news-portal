import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function LikeButton({ articleId, initialLiked = false, initialLikesCount = 0, onToggle, size = 18 }) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    setLiked(initialLiked);
    setLikesCount(initialLikesCount);
  }, [initialLiked, initialLikesCount]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please log in to like articles', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/api/likes/article/${articleId}`);
      setLiked(res.liked);
      setLikesCount(res.like_count);
      if (onToggle) onToggle(res.liked, res.like_count);
    } catch (err) {
      showToast(err.message || 'Failed to update like status', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`action-btn ${liked ? 'liked' : ''}`}
      onClick={handleLike}
      disabled={loading}
      title={liked ? 'Unlike' : 'Like'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
      }}
    >
      <Heart
        size={size}
        fill={liked ? 'currentColor' : 'none'}
        style={{
          transition: 'transform var(--transition-spring)',
          transform: loading ? 'scale(0.85)' : 'scale(1)',
          animation: liked && !loading ? 'heartbeat 0.4s ease-in-out' : 'none',
        }}
      />
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
        {likesCount}
      </span>
    </button>
  );
}
