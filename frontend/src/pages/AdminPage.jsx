import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Calendar, Sparkles, FileText, Users, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

export default function AdminPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ articles: 0, views: 0, comments: 0 });
  const { showToast } = useToast();

  useEffect(() => {
    fetchArticlesAndStats();
  }, []);

  const fetchArticlesAndStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/articles?limit=100&status=all');
      if (res.success) {
        const items = res.data || [];
        setArticles(items);
        
        // Sum up metrics to populate cards
        const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
        
        // Query categories just for metadata stats
        const catRes = await api.get('/api/categories');
        const commentsCount = items.reduce((sum, item) => sum + (item.comment_count || 0), 0);
        
        setStats({
          articles: items.length,
          views: totalViews,
          comments: commentsCount,
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to populate admin database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article? All associated likes, bookmarks, and comments will be permanently purged.')) return;

    try {
      await api.delete(`/api/articles/${id}`);
      setArticles(prev => prev.filter(a => a.id !== id));
      setStats(prev => ({ ...prev, articles: prev.articles - 1 }));
      showToast('Article deleted successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete article', 'error');
    }
  };

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return '';
      const isoStr = dateStr.replace(' ', 'T') + 'Z';
      return format(parseISO(isoStr), 'MMM dd, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '32px' }}>
      {/* Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1.5px solid var(--color-border)', 
          paddingBottom: '20px', 
          marginBottom: '32px' 
        }}
      >
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Publish, modify, and delete editorial news articles</p>
        </div>
        <Link to="/admin/articles/new" className="btn btn-primary" style={{ borderRadius: '30px' }}>
          <Plus size={16} /> New Article
        </Link>
      </div>

      {/* Statistics summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="stat-card">
          <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={14} /> Total Articles
          </div>
          <div className="stat-card-value">{stats.articles}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={14} /> Aggregate Views
          </div>
          <div className="stat-card-value">{stats.views.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={14} /> Discussions
          </div>
          <div className="stat-card-value">{stats.comments}</div>
        </div>
      </div>

      {/* Main Database Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)', fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-bold)' }}>
          Database Articles
        </h3>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            Populating dashboard articles...
          </div>
        ) : articles.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Published</th>
                  <th>Views</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((art) => (
                  <tr key={art.id}>
                    <td style={{ fontWeight: 'var(--weight-semibold)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Link to={`/article/${art.slug}`} style={{ color: 'var(--color-text-primary)' }}>
                        {art.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge badge-${art.category_slug?.toLowerCase()}`} style={{ fontSize: '10px' }}>
                        {art.category_name}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{art.author_name}</td>
                    <td style={{ color: 'var(--color-text-tertiary)' }}>{formatDate(art.created_at)}</td>
                    <td style={{ fontWeight: 'var(--weight-medium)' }}>{art.views}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Link 
                          to={`/admin/articles/${art.id}/edit`} 
                          className="btn btn-secondary btn-icon" 
                          style={{ padding: '6px', width: '32px', height: '32px', borderRadius: '50%' }}
                          title="Edit Article"
                        >
                          <Edit2 size={12} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(art.id)} 
                          className="btn btn-ghost btn-icon" 
                          style={{ padding: '6px', width: '32px', height: '32px', borderRadius: '50%', color: 'var(--color-error)' }}
                          title="Delete Article"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3 className="empty-state-title">No articles published yet</h3>
            <p className="empty-state-text">Create your first editorial story by clicking the button above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
