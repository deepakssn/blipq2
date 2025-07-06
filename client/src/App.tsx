import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import EmailVerificationPage from './pages/Auth/EmailVerificationPage';
import LandingPage from './pages/LandingPage';
import PostDetailPage from './pages/Posts/PostDetailPage';
import CreateEditPostPage from './pages/Posts/CreateEditPostPage';
import BookmarkedPage from './pages/User/BookmarkedPage';
import LikedPostsPage from './pages/User/LikedPostsPage';
import ProtectedRoute from './components/common/ProtectedRoute'; // Import ProtectedRoute
import SuperAdminDashboard from './pages/Admin/SuperAdminDashboard'; // Import SuperAdminDashboard
import OrgAdminDashboard from './pages/Admin/OrgAdminDashboard'; // Import OrgAdminDashboard
import FlaggedPostsPage from './pages/Admin/FlaggedPostsPage'; // Import FlaggedPostsPage


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/post/:postId" element={<PostDetailPage />} />

              {/* Protected Routes (User specific and Post creation/editing) */}
              <Route path="/post/new" element={<ProtectedRoute><CreateEditPostPage /></ProtectedRoute>} />
              <Route path="/post/:postId/edit" element={<ProtectedRoute><CreateEditPostPage /></ProtectedRoute>} />
              <Route path="/my-account/bookmarks" element={<ProtectedRoute><BookmarkedPage /></ProtectedRoute>} />
              <Route path="/my-account/liked-posts" element={<ProtectedRoute><LikedPostsPage /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route
                path="/admin/super"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/organization"
                element={
                  <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}> {/* super_admin can also access org_admin dashboard */}
                    <OrgAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/flagged-posts"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'org_admin']}>
                    <FlaggedPostsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback for unknown routes or an explicit "Not Found" page can be added here */}
              {/* <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
