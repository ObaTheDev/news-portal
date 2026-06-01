import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Eye, Sparkles } from "lucide-react";
import { api } from "../utils/api";
import CategoryBadge from "../components/CategoryBadge";
import LikeButton from "../components/LikeButton";
import BookmarkButton from "../components/BookmarkButton";
import ShareButton from "../components/ShareButton";
import CommentSection from "../components/CommentSection";
import { format, parseISO } from "date-fns";

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return '';
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const calculateReadingTime = (text) => {
    if (!text) return '1 min';
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / 225);
    return `${time} min read`;
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await api.get(`/api/articles/${slug}`);
        if (res.success && res.article) {
          setArticle(res.article);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        setNotFound(true);
      }
    })();
  }, [slug]);

  if (notFound) return <div>article not found</div>;
  if (!article) return <div>loading...</div>;

  return (
    <main>
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
    </main>
  );
}
