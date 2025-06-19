import React from 'react';

const Navbar = ({ user, onLogin, onLogout, onSignup, onSwitchAuthMode, showSignup }) => {
  return (
    <nav className="w-full bg-white shadow-md py-3 px-6 flex items-center justify-between fixed top-0 left-0 z-50">
      <div className="text-2xl font-bold text-blue-700 tracking-wide select-none">EasyRoute</div>
      <div className="flex items-center gap-4">
        {!user ? (
          showSignup ? (
            <>
              <button
                className="text-blue-600 hover:underline font-medium"
                onClick={onSwitchAuthMode}
              >
                Login
              </button>
            </>
          ) : (
            <>
              <button
                className="text-blue-600 hover:underline font-medium"
                onClick={onSwitchAuthMode}
              >
                Sign Up
              </button>
            </>
          )
        ) : (
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold transition"
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