import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // To conditionally show links

const Header: React.FC = () => {
  const { user, logout } = useAuth(); // Get user and logout function

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold hover:text-blue-200">
          Classified Ads
        </Link>
        <nav className="space-x-4">
          <Link to="/" className="hover:text-blue-200">Home</Link>
          {/* More general navigation links can go here */}
        </nav>
        <div className="space-x-4">
          {user ? (
            <>
              {/* User-specific links */}
              <Link to="/my-account/bookmarks" className="hover:text-blue-200 text-sm">Bookmarks</Link>
              <Link to="/my-account/liked-posts" className="hover:text-blue-200 text-sm">Liked</Link>

              {/* Admin Links - Conditionally Rendered */}
              {user.role === 'super_admin' && (
                <Link to="/admin/super" className="hover:text-blue-200 text-sm">Super Admin</Link>
              )}
              {(user.role === 'org_admin' || user.role === 'super_admin') && (
                <Link to="/admin/organization" className="hover:text-blue-200 text-sm">Org Admin</Link>
              )}
              {(user.role === 'super_admin' || user.role === 'org_admin') && ( // Or a specific 'moderator' role
                <Link to="/admin/flagged-posts" className="hover:text-blue-200 text-sm">Flagged Posts</Link>
              )}

              <Link to="/post/new" className="bg-yellow-400 hover:bg-yellow-500 text-blue-800 font-semibold px-3 py-2 rounded-md text-sm">
                Post Ad
              </Link>
              <button
                onClick={logout}
                className="hover:text-blue-200 underline text-sm"
              >
                Logout ({user.email})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">Login</Link>
              <Link to="/register" className="hover:text-blue-200">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
