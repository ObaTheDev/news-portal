import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for performance
const HomePage = lazy(() => import('./pages/HomePage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ArticleEditorPage = lazy(() => import('./pages/ArticleEditorPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page-wrapper animate-fade-in">
        <Suspense
          fallback={
            <div className="loading-center">
              <div className="spinner"></div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            
            {/* Authenticated Routes */}
            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute>
                  <BookmarksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            
            {/* Guest Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/articles/new"
              element={
                <ProtectedRoute adminOnly>
                  <ArticleEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/articles/:id/edit"
              element={
                <ProtectedRoute adminOnly>
                  <ArticleEditorPage />
                </ProtectedRoute>
              }
            />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
