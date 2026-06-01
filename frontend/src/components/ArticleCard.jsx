import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import CategoryBadge from './CategoryBadge';
import BookmarkButton from './BookmarkButton';
import { useAuth } from '../contexts/AuthContext';

export default function ArticleCard({ article, variant = 'standard', onBookmarkToggle }) {
  const { user } = useAuth();
  
  if (!article) return null;

  const {
    id,
    title,
    slug,
    excerpt,
    cover_image,
    category_name,
    category_slug,
    author_display_name,
    author_username,
    views,
    created_at,
    bookmarked,
  } = article;

  // Reading time calculator (simple guess: 200 words per minute)
  const calculateReadingTime = (text) => {
    if (!text) return '1 min';
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / 225);
    return `${time} min read`;
  };

  const getRelativeTime = (dateStr) => {
    try {
      if (!dateStr) return '';
      // PostgreSQL returns valid ISO 8601 timestamps — parse directly
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
    } catch (e) {
      return dateStr || '';
    }
  };

  const articleUrl = `/article/${slug}`;

  if (variant === 'featured') {
    return (
      <Link to={articleUrl} className="card card-featured">
        <div className="card-image">
          <img src={cover_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200'} alt={title} loading="lazy" />
          <div className="card-image-overlay"></div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <CategoryBadge name={category_name} slug={category_slug} />
            <BookmarkButton articleId={id} initialBookmarked={bookmarked} onToggle={onBookmarkToggle} />
          </div>
          <h2 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)', color: 'white', fontFamily: 'var(--font-serif)', lineHeight: 'var(--leading-snug)' }}>
            {title}
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', line_height: 'var(--leading-normal)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {excerpt}
          </p>
          <div className="article-meta" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
            <span style={{ color: 'white', fontWeight: 'var(--weight-medium)' }}>By {author_display_name || author_username}</span>
            <span className="article-meta-dot" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}></span>
            <span>{getRelativeTime(created_at)}</span>
            <span className="article-meta-dot" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={14} /> {views}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={articleUrl} className="card card-compact">
        <div className="card-image">
          <img src={cover_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=400'} alt={title} loading="lazy" />
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <CategoryBadge name={category_name} slug={category_slug} />
            <BookmarkButton articleId={id} initialBookmarked={bookmarked} onToggle={onBookmarkToggle} />
          </div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)', lineHeight: 'var(--leading-tight)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </h3>
          <div className="article-meta" style={{ fontSize: 'var(--text-xs)' }}>
            <span>By {author_display_name || author_username}</span>
            <span className="article-meta-dot"></span>
            <span>{getRelativeTime(created_at)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="card card-featured" style={{ height: '100%' }}>
      <Link to={articleUrl} className="card-image" style={{ height: '100%', aspectRatio: 'auto' }}>
        <img src={cover_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600'} alt={title} loading="lazy" style={{ height: '100%' }} />
        <div className="card-image-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }}></div>
      </Link>
      <div className="card-body" style={{ zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <CategoryBadge name={category_name} slug={category_slug} />
          <BookmarkButton articleId={id} initialBookmarked={bookmarked} onToggle={onBookmarkToggle} />
        </div>
        <Link to={articleUrl}>
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)', color: 'white', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {title}
          </h3>
        </Link>
        <div className="article-meta" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 'var(--text-xs)', marginTop: 'auto' }}>
          <span>{author_display_name || author_username}</span>
          <span className="article-meta-dot" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}></span>
          <span>{getRelativeTime(created_at)}</span>
        </div>
      </div>
    </article>
  );
}
