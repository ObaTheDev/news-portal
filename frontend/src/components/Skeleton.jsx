import React from 'react';

export function CardSkeleton() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton skeleton-image" style={{ aspectRatio: '16/9' }}></div>
      <div className="card-body">
        <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '12px' }}></div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: '20px' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="skeleton skeleton-avatar"></div>
          <div className="skeleton skeleton-text" style={{ width: '30%', height: '12px', marginBottom: 0 }}></div>
        </div>
      </div>
    </div>
  );
}

export function FeaturedSkeleton() {
  return (
    <div className="card card-featured skeleton-card" style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px' }}>
      <div className="skeleton" style={{ position: 'absolute', inset: 0, zIndex: 0 }}></div>
      <div style={{ zIndex: 1, width: '60%' }}>
        <div className="skeleton skeleton-text" style={{ width: '20%', height: '14px', marginBottom: '16px', background: 'rgba(255,255,255,0.2)' }}></div>
        <div className="skeleton skeleton-title" style={{ height: '2.5rem', background: 'rgba(255,255,255,0.2)' }}></div>
        <div className="skeleton skeleton-text" style={{ height: '14px', background: 'rgba(255,255,255,0.2)', marginBottom: '8px' }}></div>
        <div className="skeleton skeleton-text" style={{ height: '14px', width: '80%', background: 'rgba(255,255,255,0.2)' }}></div>
      </div>
    </div>
  );
}

export function CompactSkeleton() {
  return (
    <div className="card card-compact skeleton-card" style={{ display: 'flex', flexDirection: 'row' }}>
      <div className="skeleton" style={{ width: '140px', minWidth: '140px', height: '140px', borderRadius: 'var(--radius-md)' }}></div>
      <div className="card-body" style={{ flex: 1, padding: '16px' }}>
        <div className="skeleton skeleton-text" style={{ width: '30%', height: '12px' }}></div>
        <div className="skeleton skeleton-title" style={{ height: '1.25rem' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '90%', height: '12px' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '70%', height: '12px' }}></div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="container-narrow">
      <div className="skeleton skeleton-text" style={{ width: '20%', height: '14px', marginBottom: '16px' }}></div>
      <div className="skeleton skeleton-title" style={{ height: '3rem', width: '90%', marginBottom: '24px' }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div className="skeleton skeleton-avatar" style={{ width: '48px', height: '48px' }}></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '30%', height: '14px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '20%', height: '12px', marginBottom: 0 }}></div>
        </div>
      </div>
      <div className="skeleton skeleton-image" style={{ aspectRatio: '21/9', marginBottom: '40px', borderRadius: 'var(--radius-xl)' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '18px', width: '100%', marginBottom: '16px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '18px', width: '95%', marginBottom: '16px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '18px', width: '98%', marginBottom: '16px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '18px', width: '80%', marginBottom: '40px' }}></div>
      <div className="skeleton skeleton-title" style={{ height: '2rem', width: '50%', marginBottom: '20px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '18px', width: '100%', marginBottom: '16px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '18px', width: '90%', marginBottom: '16px' }}></div>
    </div>
  );
}
