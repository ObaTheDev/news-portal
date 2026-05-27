import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0); // 0-3
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || '/';

  // Calculate Password Strength
  useEffect(() => {
    if (!password) {
      setStrength(0);
      return;
    }
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    setStrength(score);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
      showToast('Account registered successfully! Welcome!', 'success');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      showToast(err.message || 'Registration failed. Choose a different username or email.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const strengthLabels = ['Weak', 'Medium', 'Strong'];
  const strengthClasses = ['weak', 'medium', 'strong'];

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <h2 className="auth-title" style={{ fontFamily: 'var(--font-serif)' }}>Create Account</h2>
        <p className="auth-subtitle">Join us to personalize your editorial news reading feed</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
                required
              />
              <User 
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

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters..."
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

            {/* Password Strength Indicator */}
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                  <span>Password Strength</span>
                  <span style={{ fontWeight: 'var(--weight-semibold)', color: `var(--color-${strengthClasses[strength - 1] || 'text-tertiary'})` }}>
                    {strengthLabels[strength - 1] || 'Too Short'}
                  </span>
                </div>
                <div className="password-strength">
                  <div className={`password-strength-bar ${strength >= 1 ? `active ${strengthClasses[strength - 1]}` : ''}`}></div>
                  <div className={`password-strength-bar ${strength >= 2 ? `active ${strengthClasses[strength - 1]}` : ''}`}></div>
                  <div className={`password-strength-bar ${strength >= 3 ? `active ${strengthClasses[strength - 1]}` : ''}`}></div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
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
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: 'var(--radius-md)' }} disabled={submitting}>
            {submitting ? 'Registering...' : 'Create Account'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" state={{ from: location.state?.from }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
