"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { roomsApi } from "../../../api";
import { RoomDetails } from "@/types/api";
import { useAuth } from "../../../contexts/AuthContext";
import { getSocketService, RoomEventData } from "../../../lib/socket";

interface GameState {
  phase: "waiting" | "playing" | "finished";
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
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const roomId = params.id as string;
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    phase: "waiting",
    pot: 0,
  });

  const [playerHand] = useState(["A♠", "K♥", "2♣", "J♦", "Q♠"]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [claimCard, setClaimCard] = useState("A");
  const [claimCount, setClaimCount] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomMessages, setRoomMessages] = useState<string[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);

  const cardValues = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];

  // WebSocket event handlers
  const handleUserJoined = useCallback((data: RoomEventData) => {
    setRoomMessages(prev => [...prev, `User joined room`]);
    if (data.userId && !connectedPlayers.includes(data.userId)) {
      setConnectedPlayers(prev => [...prev, data.userId!]);
    }
  }, [connectedPlayers]);

  const handleUserLeft = useCallback((data: RoomEventData) => {
    setRoomMessages(prev => [...prev, `User left room`]);
    if (data.userId) {
      setConnectedPlayers(prev => prev.filter(id => id !== data.userId));
    }
  }, []);

  const handleRoomState = useCallback((data: any) => {
    console.log('Room state update:', data);
    if (data.room) {
      setRoomDetails(data.room);
      setConnectedPlayers(data.room.players || []);
    }
  }, []);

  const handleSocketError = useCallback((error: any) => {
    console.error('Socket error:', error);
    setRoomMessages(prev => [...prev, `Error: ${error.message || 'Connection error'}`]);
  }, []);

  // Initialize room and WebSocket connection
  useEffect(() => {
    const initializeRoom = async () => {
      // Wait for auth loading to complete
      if (authLoading) return;

      // Check authentication
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        // Fetch room details first
        const roomDetails = await roomsApi.getRoomDetails(roomId);
        setRoomDetails(roomDetails);
        setConnectedPlayers(roomDetails.players || []);
        
        console.log("Room details loaded:", roomDetails);

        // Initialize WebSocket connection
        const socketService = getSocketService();
        
        try {
          await socketService.connect();
          setSocketConnected(true);
          console.log("✅ Socket connected");

          // Set up event listeners
          const unsubJoined = socketService.onUserJoinedRoom(handleUserJoined);
          const unsubLeft = socketService.onUserLeftRoom(handleUserLeft);
          const unsubRoomState = socketService.onRoomState(handleRoomState);
          const unsubError = socketService.onError(handleSocketError);

          // Join the room via WebSocket
          await socketService.joinRoom(roomId);
          setRoomMessages(prev => [...prev, "Connected to room"]);

          // Cleanup function
          return () => {
            unsubJoined();
            unsubLeft();
            unsubRoomState();
            unsubError();
            socketService.leaveRoom(roomId).catch(console.error);
          };

        } catch (socketError: any) {
          console.error("Socket connection failed:", socketError);
          setRoomMessages(prev => [...prev, `Socket error: ${socketError.message}`]);
          // Continue without socket connection
        }

      } catch (error: any) {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load room"
        );
      } finally {
        setIsLoading(false);
      }
    };

    const cleanup = initializeRoom();
    
    // Cleanup on unmount
    return () => {
      cleanup?.then?.(cleanupFn => cleanupFn?.());
    };
  }, [roomId, router, authLoading, isAuthenticated, handleUserJoined, handleUserLeft, handleRoomState, handleSocketError]);

  const handleCardSelect = (card: string) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleMakeClaim = () => {
    if (selectedCards.length === 0) return;

    setGameState((prev) => ({
      ...prev,
      lastClaim: {
        player: "You",
        card: claimCard,
        count: claimCount,
      },
    }));

    setSelectedCards([]);
  };

  const handleChallenge = () => {
    // TODO: Implement challenge logic
    console.log("Challenge made!");
  };

  const handleReady = () => {
    setIsReady(!isReady);
    // TODO: Send ready state to server via WebSocket
    const socketService = getSocketService();
    socketService.emit('player_ready', { roomId, ready: !isReady });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    setRoomMessages(prev => [...prev, `You: ${chatMessage}`]);
    
    // TODO: Send message via WebSocket
    const socketService = getSocketService();
    socketService.emit('chat_message', { roomId, message: chatMessage });
    
    setChatMessage("");
  };

  const startGame = () => {
    setGameState((prev) => ({ ...prev, phase: "playing" }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center">
        <div className="text-red-400 text-xl">Loading room...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will redirect to login
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center">
        <div className="bg-black/50 backdrop-blur-sm p-8 rounded-lg border border-red-700/30 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-red-200 mb-6">{error}</p>
          <Link
            href="/rooms"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-red-300">
                {socketConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-red-300">
              {gameState.phase === "waiting"
                ? "Waiting to start"
                : "Game in progress"}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-3">
            {/* Game Status */}
            {gameState.phase === "playing" && (
              <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6 mb-6">
                <h2 className="text-xl font-semibold text-red-300 mb-4">
                  Game Status
                </h2>
                {gameState.lastClaim ? (
                  <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
                    <div className="text-yellow-200">
                      <strong>{gameState.lastClaim.player}</strong> claims to
                      have played{" "}
                      <strong>
                        {gameState.lastClaim.count}x {gameState.lastClaim.card}
                      </strong>
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
                  <div className="text-red-200/80">
                    Waiting for first move...
                  </div>
                )}
              </div>
            )}

            {/* Player Hand */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6">
              <h2 className="text-xl font-semibold text-red-300 mb-4">
                Your Hand
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {playerHand.map((card, index) => (
                  <div
                    key={index}
                    onClick={() => handleCardSelect(card)}
                    className={`w-16 h-24 bg-white rounded-lg flex items-center justify-center cursor-pointer transform transition-all ${
                      selectedCards.includes(card)
                        ? "scale-105 ring-2 ring-yellow-400 -translate-y-2"
                        : "hover:scale-105"
                    }`}
                  >
                    <span
                      className={`font-bold text-lg ${
                        card.includes("♥") || card.includes("♦")
                          ? "text-red-600"
                          : "text-black"
                      }`}
                    >
                      {card}
                    </span>
                  </div>
                ))}
              </div>

              {gameState.phase === "playing" && selectedCards.length > 0 && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <label className="text-red-300 text-sm font-medium">
                        I'm playing
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={claimCount}
                        onChange={(e) =>
                          setClaimCount(parseInt(e.target.value))
                        }
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
                        {cardValues.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
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
            {gameState.phase === "waiting" && (
              <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6 mb-6">
                <h3 className="text-lg font-semibold text-red-300 mb-4">
                  Game Setup
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={handleReady}
                    className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
                      isReady
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {isReady ? "Ready!" : "Not Ready"}
                  </button>

                  {roomDetails?.hostUserId === user?.id && (
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

            {/* Room Info */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-300 mb-3">Room Info</h3>
              <div className="text-red-200/80 space-y-1 text-sm">
                <p><strong>Players:</strong> {connectedPlayers.length}/{roomDetails?.maxPlayers || 0}</p>
                <p><strong>Host:</strong> {roomDetails?.hostUserId === user?.id ? 'You' : 'Other'}</p>
                <p><strong>Status:</strong> {socketConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-red-700/30 p-6">
              <h3 className="text-lg font-semibold text-red-300 mb-4">
                Chat & Events
              </h3>
              <div className="h-48 bg-black/20 rounded border border-red-700/30 p-3 mb-3 overflow-y-auto">
                {roomMessages.map((message, index) => (
                  <div key={index} className="text-red-200/80 text-sm mb-1">
                    {message}
                  </div>
                ))}
                {roomMessages.length === 0 && (
                  <div className="text-red-400/50 text-sm italic">
                    No messages yet...
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-black/30 border border-red-700/50 rounded text-white placeholder-red-400/50 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button 
                  type="submit"
                  disabled={!chatMessage.trim() || !socketConnected}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
