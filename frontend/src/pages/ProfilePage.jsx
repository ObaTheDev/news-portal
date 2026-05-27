import React, { useState } from 'react';
import { User, Shield, Key, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProfile({
        display_name: displayName,
        bio: bio,
        avatar_url: avatarUrl,
      });
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile settings', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-narrow animate-fade-in" style={{ marginTop: '32px' }}>
      <div className="page-header" style={{ borderBottom: '1.5px solid var(--color-border)', paddingBottom: '20px', marginBottom: '32px' }}>
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your personal information and biography</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Profile Card Summary */}
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--color-bg-secondary)' }}>
          <div className="avatar avatar-lg" style={{ width: '80px', height: '80px', fontSize: 'var(--text-2xl)' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} />
            ) : (
              displayName?.charAt(0) || user?.username?.charAt(0)
            )}
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '4px' }}>{displayName || user?.username}</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>@{user?.username}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              {user?.role === 'admin' ? (
                <>
                  <Shield size={12} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-accent)' }}>Editor / Administrator</span>
                </>
              ) : (
                <>
                  <User size={12} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Subscriber</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '24px', fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-bold)' }}>
            Personal Details
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                value={user?.username || ''} 
                disabled 
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <span className="form-hint">Usernames are permanent and cannot be modified.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={user?.email || ''} 
                disabled 
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <span className="form-hint">Email address modifications require administrator assistance.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Your public display name..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar URL</label>
              <input 
                type="url" 
                className="form-input" 
                placeholder="Link to an online image (https://...)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <span className="form-hint">Provide an online hotlink to update your image avatar.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Biography / Bio</label>
              <textarea 
                className="form-textarea" 
                placeholder="Share a short bio with the community..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={250}
              ></textarea>
              <span className="form-hint">Max 250 characters. Markdown or HTML is not supported.</span>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting || (displayName === user?.display_name && bio === user?.bio && avatarUrl === user?.avatar_url)}
              style={{ marginTop: '12px' }}
            >
              {submitting ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
