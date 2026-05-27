import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      await login(email, password);
      showToast('Welcome back to The Daily Digest!', 'success');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      showToast(err.message || 'Login attempt failed. Check your credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <h2 className="auth-title" style={{ fontFamily: 'var(--font-serif)' }}>Welcome Back</h2>
        <p className="auth-subtitle">Log in to sync your bookmarks, comments, and recommendations</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
                required
              />
              <Mail 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--color-text-tertiary)' 
                }} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>
                Forgot Password?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                required
              />
              <Lock 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--color-text-tertiary)' 
                }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: 'var(--radius-md)' }} disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          Don&rsquo;t have an account?{' '}
          <Link to="/register" state={{ from: location.state?.from }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
