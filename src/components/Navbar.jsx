import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Navbar = ({ user, onLogin, onLogout, onSignup, onSwitchAuthMode, showSignup, routeInfo }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="w-full bg-white dark:bg-gray-800 shadow-md py-3 px-6 flex items-center justify-between fixed top-0 left-0 z-50 transition-colors">
      <div className="flex items-center gap-6">
        {routeInfo && (
          <div className="px-3 py-1 rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-semibold text-sm flex gap-4 items-center">
            <span>Distance: {routeInfo.distance.toFixed(2)} km</span>
            <span>Time: {routeInfo.time} min</span>
          </div>
        )}
        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 tracking-wide select-none">EasyRoute</div>
      </div>
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600 dark:text-gray-300" />}
        </button>

        {!user ? (
          showSignup ? (
            <>
              <button
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
                onClick={onSwitchAuthMode}
              >
                Login
              </button>
            </>
          ) : (
            <>
              <button
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
                onClick={onSwitchAuthMode}
              >
                Sign Up
              </button>
            </>
          )
        ) : (
          <button
            className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors"
            onClick={onLogout}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 