import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Github, Twitter, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">The Daily Digest</div>
            <p className="footer-desc">
              Your editorial news portal delivering insights, deep analyses, and reporting across the fields of Technology, Politics, Sports, Business, and Entertainment.
            </p>
          </div>
          
          <div>
            <h4 className="footer-heading">Categories</h4>
            <div className="footer-links">
              <Link to="/category/technology" className="footer-link">Technology</Link>
              <Link to="/category/politics" className="footer-link">Politics</Link>
              <Link to="/category/sports" className="footer-link">Sports</Link>
              <Link to="/category/science" className="footer-link">Science</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Company</h4>
            <div className="footer-links">
              <span className="footer-link" style={{ cursor: 'pointer' }}>About Us</span>
              <span className="footer-link" style={{ cursor: 'pointer' }}>Careers</span>
              <span className="footer-link" style={{ cursor: 'pointer' }}>Advertise</span>
              <span className="footer-link" style={{ cursor: 'pointer' }}>Contact</span>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Follow Us</h4>
            <div className="footer-links">
              <span className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Twitter size={14} /> Twitter
              </span>
              <span className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Github size={14} /> GitHub
              </span>
              <span className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Mail size={14} /> Newsletter
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {currentYear} The Daily Digest. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Built with <Heart size={12} fill="var(--color-accent)" style={{ color: 'var(--color-accent)' }} /> for excellence.
          </div>
        </div>
      </div>
    </footer>
  );
}
