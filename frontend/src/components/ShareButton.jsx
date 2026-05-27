import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link, Twitter, Facebook, Linkedin, Check } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function ShareButton({ title, slug, size = 18 }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const { showToast } = useToast();

  const shareUrl = `${window.location.origin}/article/${slug}`;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShareClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: shareUrl,
        });
        showToast('Shared successfully!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowMenu(true);
        }
      }
    } else {
      setShowMenu(prev => !prev);
    }
  };

  const copyToClipboard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        showToast('Link copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
        setShowMenu(false);
      })
      .catch(() => {
        showToast('Failed to copy link', 'error');
      });
  };

  const shareOnTwitter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    setShowMenu(false);
  };

  const shareOnFacebook = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    setShowMenu(false);
  };

  const shareOnLinkedin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    setShowMenu(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      <button
        className="action-btn"
        onClick={handleShareClick}
        title="Share Article"
        style={{ display: 'inline-flex', padding: '6px', borderRadius: '50%' }}
      >
        <Share2 size={size} />
      </button>

      {showMenu && (
        <div className="share-menu">
          <button className="dropdown-item" onClick={copyToClipboard}>
            {copied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Link size={14} />}
            <span>Copy Link</span>
          </button>
          <button className="dropdown-item" onClick={shareOnTwitter}>
            <Twitter size={14} />
            <span>Twitter</span>
          </button>
          <button className="dropdown-item" onClick={shareOnFacebook}>
            <Facebook size={14} />
            <span>Facebook</span>
          </button>
          <button className="dropdown-item" onClick={shareOnLinkedin}>
            <Linkedin size={14} />
            <span>LinkedIn</span>
          </button>
        </div>
      )}
    </div>
  );
}
