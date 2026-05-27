import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '40px 20px' }}>
      <div 
        style={{ 
          fontSize: 'var(--text-5xl)', 
          fontFamily: 'var(--font-serif)', 
          fontWeight: 'var(--weight-bold)', 
          color: 'var(--color-accent)', 
          marginBottom: '16px' 
        }}
      >
        404
      </div>
      <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '12px' }}>Story Not Found</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', maxWidth: '460px', marginBottom: '32px', lineHeight: 'var(--leading-normal)' }}>
        The article, section, or report you are trying to access has been moved, archived, or does not exist. Explore our homepage to discover the latest coverage.
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to="/" className="btn btn-primary" style={{ borderRadius: '30px' }}>
          <Home size={16} /> Back to Home
        </Link>
        <Link to="/search" className="btn btn-secondary" style={{ borderRadius: '30px' }}>
          <Compass size={16} /> Explore News
        </Link>
      </div>
    </div>
  );
}
