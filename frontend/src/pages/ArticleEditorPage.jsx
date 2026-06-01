import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Edit3 } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

export default function ArticleEditorPage() {
  const { id } = useParams(); // Exists if we are editing
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch Categories
  useEffect(() => {
    api.get('/api/categories')
      .then(res => setCategories(res.categories || []))
      .catch(err => console.error('Failed to load categories', err));
  }, []);

  // Fetch Article details if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchArticleDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/articles/by-id/${id}`);
        // Note: we'll build a simple endpoint GET /api/articles/by-id/:id or query articles by ID
        // To be safe, let's fetch articles and find match, or call API
        if (res.success && res.article) {
          const art = res.article;
          setTitle(art.title);
          setCoverImage(art.cover_image);
          setCategoryId(art.category_id);
          setExcerpt(art.excerpt);
          setContent(art.content);
        }
      } catch (err) {
        showToast(err.message || 'Failed to fetch article details', 'error');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetails();
  }, [id, isEditMode, navigate, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !categoryId || !content) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    const articlePayload = {
      title,
      cover_image: coverImage,
      category_id: categoryId,
      excerpt,
      content,
    };

    try {
      if (isEditMode) {
        await api.put(`/api/articles/${id}`, articlePayload);
        showToast('Article updated successfully', 'success');
      } else {
        await api.post('/api/articles', articlePayload);
        showToast('Article published successfully', 'success');
      }
      navigate('/admin');
    } catch (err) {
      showToast(err.message || 'Failed to save article details', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ marginTop: '24px' }}>
      {/* Header Back button */}
      <button 
        onClick={() => navigate('/admin')} 
        className="btn btn-ghost" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingLeft: '0' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">{isEditMode ? 'Edit Article' : 'Publish New Article'}</h1>
          <p className="page-subtitle">Draft your journalism masterpiece with rich editorial formatting</p>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={() => setPreviewMode(prev => !prev)}
          style={{ borderRadius: '20px' }}
        >
          {previewMode ? <Edit3 size={16} /> : <Eye size={16} />}
          {previewMode ? 'Edit Mode' : 'Preview Mode'}
        </button>
      </div>

      {previewMode ? (
        /* Preview Block */
        <div className="card" style={{ padding: '40px', border: '1px solid var(--color-border)' }}>
          <span className="badge" style={{ marginBottom: '16px', background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
            {categories.find(c => c.id === categoryId)?.name || 'Category'}
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', marginBottom: '24px' }}>{title || 'Untitled Article'}</h1>
          
          {coverImage && (
            <div style={{ width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-xl)', marginBottom: '32px' }}>
              <img src={coverImage} alt={title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
            </div>
          )}
          
          {excerpt && (
            <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', marginBottom: '24px', borderLeft: '3px solid var(--color-accent)', paddingLeft: '16px' }}>
              {excerpt}
            </p>
          )}

          <div 
            className="article-content" 
            dangerouslySetInnerHTML={{ __html: content || '<p>Start typing content to preview your story...</p>' }}
          />
        </div>
      ) : (
        /* Form Editor Card */
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Article Title *</label>
              <input
                type="text"
                placeholder="Enter article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                maxLength={100}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="article-grid-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Excerpt / Short Description *</label>
              <textarea
                placeholder="Write a catchy 2-3 sentence overview for the home grid..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="form-textarea"
                style={{ minHeight: '80px' }}
                maxLength={250}
                required
              ></textarea>
              <span className="form-hint">Max 250 characters. Used for summaries.</span>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Article Content (HTML/Rich-Text) *</label>
                <span className="form-hint" style={{ marginTop: 0 }}>Basic HTML tags (&lt;p&gt;, &lt;h2&gt;, &lt;blockquote&gt;) are supported.</span>
              </div>
              <textarea
                placeholder="<p>Begin your news report here...</p>"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-textarea"
                style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save & Publish'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
