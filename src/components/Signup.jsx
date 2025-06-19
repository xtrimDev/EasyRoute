import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Signup = ({ onSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError('');
      if (onSignup) onSignup();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-green-300">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl w-96 max-w-full flex flex-col gap-4">
        <div className="flex flex-col items-center mb-4">
          <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-2">
            <span className="text-3xl font-bold text-green-600">ER</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Sign Up</h2>
          <p className="text-gray-500 text-sm">Create a new account to get started.</p>
        </div>
        <label className="text-gray-700 font-medium">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 p-3 border border-gray-300 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          required
        />
        <label className="text-gray-700 font-medium">Password</label>
        <div className="relative mb-2">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border border-gray-300 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400 transition pr-10"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600 focus:outline-none"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {error && <div className="text-red-500 mb-2 text-sm text-center">{error}</div>}
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded font-semibold transition">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup; 