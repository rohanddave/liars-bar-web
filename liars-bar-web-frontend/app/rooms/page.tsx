'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getUser } from '../../lib/auth';

export default function Rooms() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    setUser(getUser());
    setIsLoading(false);
  }, [router]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const roomId = Date.now().toString();
      
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setIsLoading(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    
    router.push(`/room/${roomCode}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center">
        <div className="text-red-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/"
            className="text-red-400 hover:text-red-300 flex items-center gap-2"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-red-400">Game Rooms</h1>
          <div className="text-red-300 text-sm">
            Welcome, {user?.username || 'Player'}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Join Room */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6">
              <h2 className="text-2xl font-semibold text-red-300 mb-4">Join Room</h2>
              <p className="text-red-200/80 mb-6">Enter a room code to join an existing game</p>
              
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-300 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-red-700/50 rounded-md text-white placeholder-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter room code"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Join Room
                </button>
              </form>
            </div>

            {/* Create Room */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6">
              <h2 className="text-2xl font-semibold text-red-300 mb-4">Create New Room</h2>
              
              {!showCreateForm ? (
                <>
                  <p className="text-red-200/80 mb-6">Create a new game room and invite friends</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Create Room
                  </button>
                </>
              ) : (
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-2">
                      Room Name
                    </label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-red-700/50 rounded-md text-white placeholder-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter room name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-2">
                      Max Players
                    </label>
                    <select
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-black/30 border border-red-700/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players</option>
                      <option value={6}>6 Players</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="mr-2 text-red-600 bg-black/30 border-red-700/50 rounded focus:ring-red-500"
                    />
                    <label htmlFor="private" className="text-sm text-red-300">
                      Private Room
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800/50 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                      {isLoading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Quick Start Info */}
          <div className="mt-8 bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6">
            <h3 className="text-lg font-semibold text-red-300 mb-3">How to Play</h3>
            <div className="text-red-200/80 space-y-2">
              <p>• <strong>Join Room:</strong> Enter a room code shared by a friend</p>
              <p>• <strong>Create Room:</strong> Make a new room and share the code with friends</p>
              <p>• <strong>Private Rooms:</strong> Only accessible with the room code</p>
              <p>• <strong>Public Rooms:</strong> Can be discovered by other players</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}