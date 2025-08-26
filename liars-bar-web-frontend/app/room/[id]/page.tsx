'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  cards: number;
  isCurrentTurn?: boolean;
}

interface GameState {
  phase: 'waiting' | 'playing' | 'finished';
  currentPlayer?: string;
  lastClaim?: {
    player: string;
    card: string;
    count: number;
  };
  pot: number;
}

export default function Room() {
  const params = useParams();
  const roomId = params.id as string;
  
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Alice', isReady: true, cards: 5, isCurrentTurn: true },
    { id: '2', name: 'Bob', isReady: true, cards: 4 },
    { id: '3', name: 'Charlie', isReady: false, cards: 6 },
  ]);
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    pot: 0
  });
  
  const [playerHand] = useState(['A♠', 'K♥', '2♣', 'J♦', 'Q♠']);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [claimCard, setClaimCard] = useState('A');
  const [claimCount, setClaimCount] = useState(1);
  const [isReady, setIsReady] = useState(false);
  
  const cardSuits = ['♠', '♥', '♣', '♦'];
  const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const handleCardSelect = (card: string) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter(c => c !== card));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleMakeClaim = () => {
    if (selectedCards.length === 0) return;
    
    setGameState(prev => ({
      ...prev,
      lastClaim: {
        player: 'You',
        card: claimCard,
        count: claimCount
      }
    }));
    
    setSelectedCards([]);
  };

  const handleChallenge = () => {
    // TODO: Implement challenge logic
    console.log('Challenge made!');
  };

  const handleReady = () => {
    setIsReady(!isReady);
    // TODO: Send ready state to server
  };

  const startGame = () => {
    setGameState(prev => ({ ...prev, phase: 'playing' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/rooms"
            className="text-red-400 hover:text-red-300 flex items-center gap-2"
          >
            ← Leave Room
          </Link>
          <h1 className="text-2xl font-bold text-red-400">Room #{roomId}</h1>
          <div className="text-red-300">
            {gameState.phase === 'waiting' ? 'Waiting to start' : 'Game in progress'}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-3">
            {/* Players */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6 mb-6">
              <h2 className="text-xl font-semibold text-red-300 mb-4">Players</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {players.map((player) => (
                  <div 
                    key={player.id}
                    className={`bg-black/30 p-4 rounded-lg border ${
                      player.isCurrentTurn ? 'border-yellow-500' : 'border-red-700/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-200">{player.name}</div>
                      <div className="text-sm text-red-300/80">{player.cards} cards</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${
                        player.isReady ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                      }`}>
                        {player.isReady ? 'Ready' : 'Not Ready'}
                      </div>
                      {player.isCurrentTurn && (
                        <div className="text-yellow-400 text-xs mt-1">Current Turn</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Status */}
            {gameState.phase === 'playing' && (
              <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6 mb-6">
                <h2 className="text-xl font-semibold text-red-300 mb-4">Game Status</h2>
                {gameState.lastClaim ? (
                  <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
                    <div className="text-yellow-200">
                      <strong>{gameState.lastClaim.player}</strong> claims to have played{' '}
                      <strong>{gameState.lastClaim.count}x {gameState.lastClaim.card}</strong>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleChallenge}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                      >
                        Challenge!
                      </button>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold transition-colors">
                        Accept
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-200/80">Waiting for first move...</div>
                )}
              </div>
            )}

            {/* Player Hand */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6">
              <h2 className="text-xl font-semibold text-red-300 mb-4">Your Hand</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {playerHand.map((card, index) => (
                  <div
                    key={index}
                    onClick={() => handleCardSelect(card)}
                    className={`w-16 h-24 bg-white rounded-lg flex items-center justify-center cursor-pointer transform transition-all ${
                      selectedCards.includes(card) 
                        ? 'scale-105 ring-2 ring-yellow-400 -translate-y-2' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <span className={`font-bold text-lg ${
                      card.includes('♥') || card.includes('♦') ? 'text-red-600' : 'text-black'
                    }`}>
                      {card}
                    </span>
                  </div>
                ))}
              </div>

              {gameState.phase === 'playing' && selectedCards.length > 0 && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <label className="text-red-300 text-sm font-medium">I'm playing</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={claimCount}
                        onChange={(e) => setClaimCount(parseInt(e.target.value))}
                        className="w-16 px-2 py-1 bg-black/30 border border-red-700/50 rounded text-white text-center"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-300 text-sm">of</span>
                      <select
                        value={claimCard}
                        onChange={(e) => setClaimCard(e.target.value)}
                        className="px-3 py-1 bg-black/30 border border-red-700/50 rounded text-white"
                      >
                        {cardValues.map(value => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleMakeClaim}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold transition-colors"
                  >
                    Make Claim ({selectedCards.length} cards selected)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Game Controls */}
            {gameState.phase === 'waiting' && (
              <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6 mb-6">
                <h3 className="text-lg font-semibold text-red-300 mb-4">Game Setup</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleReady}
                    className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
                      isReady 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isReady ? 'Ready!' : 'Not Ready'}
                  </button>
                  
                  {players.every(p => p.isReady) && (
                    <button
                      onClick={startGame}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded font-semibold transition-colors"
                    >
                      Start Game
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6">
              <h3 className="text-lg font-semibold text-red-300 mb-4">Chat</h3>
              <div className="h-64 bg-black/20 rounded border border-red-700/30 p-3 mb-3 overflow-y-auto">
                <div className="text-red-200/60 text-sm space-y-2">
                  <div><span className="text-green-400">Alice:</span> Let's play!</div>
                  <div><span className="text-blue-400">Bob:</span> I'm ready</div>
                  <div><span className="text-yellow-400">System:</span> Charlie joined the room</div>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-black/30 border border-red-700/50 rounded text-white placeholder-red-400/50 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}