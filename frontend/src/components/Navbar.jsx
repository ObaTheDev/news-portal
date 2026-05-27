import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Search, Menu, X, User, Bookmark, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../utils/api';

export default function Navbar() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Load categories
  useEffect(() => {
    api.get('/api/categories')
      .then(res => {
        setCategories(res.data || []);
      })
      .catch(err => {
        console.error('Failed to load categories', err);
      });
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target) && searchQuery === '') {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/');
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/" className="nav-brand">
          <span className="nav-logo">The Daily Digest</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          {categories.map(cat => (
            <NavLink
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {cat.name}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {/* Search Toggle/Bar */}
          <div ref={searchRef} className={`nav-search ${isSearchOpen ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  display: isSearchOpen ? 'block' : 'none',
                  width: '200px',
                  padding: '6px 12px 6px 32px',
                  borderRadius: '20px',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setIsSearchOpen(prev => !prev)}
                style={{
                  position: isSearchOpen ? 'absolute' : 'relative',
                  left: isSearchOpen ? '6px' : '0',
                  top: isSearchOpen ? '50%' : 'auto',
                  transform: isSearchOpen ? 'translateY(-50%)' : 'none',
                  padding: '6px',
                  borderRadius: '50%',
                }}
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Theme Switcher */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ borderRadius: '50%', padding: '6px' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Menu / Auth Buttons */}
          {isAuthenticated ? (
            <div className="nav-user" ref={dropdownRef}>
              <button
                className="nav-user-btn"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div className="avatar avatar-sm">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name} />
                  ) : (
                    user.display_name?.charAt(0) || user.username?.charAt(0)
                  )}
                </div>
                <ChevronDown size={14} className="desktop-only" />
              </button>

              {isDropdownOpen && (
                <div className="dropdown animate-slide-down">
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border-light)' }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                      {user.display_name || user.username}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', wordBreak: 'break-all' }}>
                      {user.email}
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <LayoutDashboard size={14} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <User size={14} />
                    <span>My Profile</span>
                  </Link>
                  
                  <Link to="/bookmarks" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <Bookmark size={14} />
                    <span>My Bookmarks</span>
                  </Link>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="btn btn-ghost btn-icon mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <span className="nav-logo">Menu</span>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '20px',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              />
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-tertiary)',
                }}
              />
            </form>

            <div className="mobile-nav-links">
              <NavLink to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </NavLink>
              {categories.map(cat => (
                <NavLink
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {cat.name}
                </NavLink>
              ))}
              
              <div className="divider"></div>
              
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <NavLink to="/admin" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                      <LayoutDashboard size={16} /> Admin Dashboard
                    </NavLink>
                  )}
                  <NavLink to="/profile" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <User size={16} /> My Profile
                  </NavLink>
                  <NavLink to="/bookmarks" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <Bookmark size={16} /> My Bookmarks
                  </NavLink>
                  <button
                    className="mobile-nav-link"
                    onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left', color: 'var(--color-error)' }}
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <Link to="/login" className="btn btn-secondary" onClick={() => setIsMobileMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link to="/register" className="btn btn-primary" onClick={() => setIsMobileMenuOpen(false)}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
