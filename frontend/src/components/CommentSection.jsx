import React, { useState, useEffect } from 'react';
import { Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function CommentSection({ articleId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/comments/article/${articleId}`);
      setComments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/api/comments/article/${articleId}`, { content: newComment });
      setComments(prev => [res.comment, ...prev]);
      setNewComment('');
      showToast('Comment posted', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      showToast('Comment deleted', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  const getRelativeTime = (dateStr) => {
    try {
      if (!dateStr) return '';
      const isoStr = dateStr.replace(' ', 'T') + 'Z';
      return formatDistanceToNow(parseISO(isoStr), { addSuffix: true });
    } catch (e) {
      return dateStr || '';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        Loading comments...
      </div>
    );
  }

  return (
    <div style={{ marginTop: '48px' }}>
      <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={20} /> Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="comment-form" style={{ marginBottom: '32px' }}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <textarea
              className="form-textarea"
              placeholder="Join the conversation..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              maxLength={1000}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div
          style={{
            padding: '20px',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Please{' '}
          <a href="/login" style={{ color: 'var(--color-accent)', fontWeight: 'var(--weight-semibold)' }}>
            log in
          </a>{' '}
          to share your thoughts on this article.
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="comment-list">
          {comments.map((comment) => {
            const isOwner = user && comment.user_id === user.id;
            const canDelete = isOwner || isAdmin;
            
            return (
              <div key={comment.id} className="comment-item">
                <div className="avatar avatar-sm">
                  {comment.avatar_url ? (
                    <img src={comment.avatar_url} alt={comment.display_name} />
                  ) : (
                    comment.display_name?.charAt(0) || comment.username?.charAt(0)
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <div>
                      <span className="comment-author">{comment.display_name || comment.username}</span>
                      {comment.role === 'admin' && (
                        <span className="badge" style={{ fontSize: '10px', padding: '1px 6px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', marginLeft: '8px' }}>
                          Editor
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="comment-date">{getRelativeTime(comment.created_at)}</span>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer', transition: 'color var(--transition-fast)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-error)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
                          title="Delete Comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="comment-text">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
          No comments yet. Be the first to start the discussion!
        </div>
      )}
    </div>
  );
}
