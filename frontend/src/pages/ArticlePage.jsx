import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, Calendar, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { api } from '../utils/api';
import CommentSection from '../components/CommentSection';
import LikeButton from '../components/LikeButton';
import BookmarkButton from '../components/BookmarkButton';
import ShareButton from '../components/ShareButton';
import CategoryBadge from '../components/CategoryBadge';
import { DetailSkeleton } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Scroll Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Article Details
  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/articles/${slug}`);
        if (res.success && res.data) {
          setArticle(res.data);
          
          // Fetch related articles by category slug
          try {
            const relRes = await api.get(`/api/articles?category=${res.data.category_slug}&limit=4`);
            const items = relRes.data || [];
            // Exclude current article from related
            setRelatedArticles(items.filter(item => item.id !== res.data.id));
          } catch (e) {
            console.error('Failed to fetch related articles', e);
          }
        } else {
          showToast('Article not found', 'error');
          navigate('/');
        }
      } catch (err) {
        showToast(err.message || 'Failed to fetch article details', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, navigate, showToast]);

  const calculateReadingTime = (text) => {
    if (!text) return '1 min';
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / 225);
    return `${time} min read`;
  };

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return '';
      const isoStr = dateStr.replace(' ', 'T') + 'Z';
      return format(parseISO(isoStr), 'MMMM dd, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ paddingTop: '40px' }}>
        <DetailSkeleton />
      </div>
    );
  }

  if (!article) return null;

  return (
    <>
      {/* Sticky Reading Progress Bar */}
      <div className="reading-progress">
        <div className="reading-progress-bar" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      <div className="container-narrow" style={{ marginTop: '24px' }}>
        {/* Back navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-ghost" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingLeft: '0' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <article>
          {/* Category Badging */}
          <div style={{ marginBottom: '16px' }}>
            <CategoryBadge name={article.category_name} slug={article.category_slug} />
          </div>

          {/* Title */}
          <h1 className="page-title" style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', lineHeight: 'var(--leading-tight)', marginBottom: '24px' }}>
            {article.title}
          </h1>

          {/* Metadata Block */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '32px' }}>
            <div className="article-meta">
              <div className="avatar avatar-sm">
                {article.author_avatar ? (
                  <img src={article.author_avatar} alt={article.author_name} />
                ) : (
                  article.author_name?.charAt(0)
                )}
              </div>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                  By {article.author_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  <Calendar size={12} />
                  <span>{formatDate(article.created_at)}</span>
                  <span>•</span>
                  <Clock size={12} />
                  <span>{calculateReadingTime(article.content)}</span>
                  <span>•</span>
                  <Eye size={12} />
                  <span>{article.views} views</span>
                </div>
              </div>
            </div>

            {/* Engagement buttons */}
            <div className="article-actions">
              <LikeButton articleId={article.id} initialLiked={article.liked} initialLikesCount={article.like_count || 0} />
              <BookmarkButton articleId={article.id} initialBookmarked={article.bookmarked} />
              <ShareButton title={article.title} slug={article.slug} />
            </div>
          </div>

          {/* Featured Cover Image */}
          {article.cover_image && (
            <div style={{ width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-xl)', marginBottom: '40px', boxShadow: 'var(--shadow-md)' }}>
              <img 
                src={article.cover_image} 
                alt={article.title} 
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '500px', objectFit: 'cover' }} 
              />
            </div>
          )}

          {/* Body Content */}
          <div 
            className="article-content" 
            dangerouslySetInnerHTML={{ __html: article.content }} 
          />
        </article>

        {/* Related Articles Panel */}
        {relatedArticles.length > 0 && (
          <div style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--color-accent)' }} /> Related Stories
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              {relatedArticles.map(rel => (
                <Link key={rel.id} to={`/article/${rel.slug}`} className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 'var(--weight-semibold)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {rel.category_name}
                  </div>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: '8px', lineHeight: 'var(--leading-tight)' }}>
                    {rel.title}
                  </h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                    By {rel.author_name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comment Section Integration */}
        <CommentSection articleId={article.id} />
      </div>
    </>
  );
}
