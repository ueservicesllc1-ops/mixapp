/**
 * Header - Navigation header component
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Music } from 'lucide-react';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-dark-800 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Music className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">MixerCurse Web</h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user?.displayName || user?.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-dark-400 hover:text-white transition-colors duration-200"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
