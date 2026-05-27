import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryBadge({ name, slug }) {
  if (!name || !slug) return null;
  return (
    <Link 
      to={`/category/${slug}`}
      className={`badge badge-${slug.toLowerCase()}`}
      onClick={(e) => e.stopPropagation()}
    >
      {name}
    </Link>
  );
}
