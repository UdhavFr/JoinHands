import React, { useState, useEffect } from 'react';
import { Menu, Heart, LogIn, User, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';
import type { AppUser } from '../types';

export function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ? transformUser(session.user) : null);
        setLoading(false);
      }
    );

    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? transformUser(user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const transformUser = (supabaseUser: any): AppUser => ({
    id: supabaseUser.id,
    email: supabaseUser.email!,
    full_name: supabaseUser.user_metadata?.full_name || '',
    user_type: supabaseUser.user_metadata?.user_type || 'volunteer',
    created_at: supabaseUser.created_at
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return <div className="h-16" />; // Empty header while loading
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo section */}
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-rose-600" />
            <Link to="/" className="ml-2 text-2xl font-bold text-rose-600 hover:text-rose-700">
              JoinHands
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#events" className="hover:text-rose-600">
              Events
            </Link>
            <Link to="/#ngos" className="hover:text-rose-600">
              NGOs
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                {user.user_type === 'ngo' && (
                  <Link to="/ngo/dashboard" className="flex items-center hover:text-rose-600">
                    <Users className="h-5 w-5 mr-1" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center hover:text-rose-600"
                >
                  <User className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700 flex items-center"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <button className="p-2 hover:text-rose-600">
              <Menu className="h-6 w-6" />
            </button>
            {/* Mobile menu dropdown - to be implemented */}
            {/* Placeholder for mobile navigation */}
          </div>
        </div>
      </nav>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </header>
  );
}