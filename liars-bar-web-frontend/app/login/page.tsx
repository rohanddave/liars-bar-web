'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../lib/auth';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login({ username, password });
      router.push('/rooms');
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-black">
      <div className="bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl w-full max-w-md border border-red-700/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-400 mb-2">Liar's Bar</h1>
          <p className="text-red-200">Enter your credentials to play</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600/50 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-red-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-red-700/50 rounded-md text-white placeholder-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-red-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-red-700/50 rounded-md text-white placeholder-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-red-300 text-sm">
            Don't have an account?{' '}
            <a href="/signup" className="text-red-400 hover:text-red-300 underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}