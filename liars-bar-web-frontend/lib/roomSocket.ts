import { socketService } from './socket';
import { getUser } from './auth';

export class RoomSocketService {
  private roomId: string | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  // Connect to the socket server
  async connect(): Promise<void> {
    try {
      await socketService.connect();
      console.log('Connected to socket server');
    } catch (error) {
      console.error('Failed to connect to socket server:', error);
      throw error;
    }
  }

  // Join a room via WebSocket
  async joinRoom(roomId: string): Promise<void> {
    try {
      // First connect if not already connected
      if (!socketService.isConnected()) {
        await this.connect();
      }

      // Join the room
      await socketService.joinRoom(roomId);
      this.roomId = roomId;
      console.log(`Joined room: ${roomId}`);
    } catch (error) {
      console.error(`Failed to join room ${roomId}:`, error);
      throw error;
    }
  }

  // Leave the current room
  async leaveRoom(): Promise<void> {
    if (!this.roomId) {
      return;
    }

    try {
      await socketService.leaveRoom();
      console.log(`Left room: ${this.roomId}`);
      this.roomId = null;
    } catch (error) {
      console.error('Failed to leave room:', error);
      throw error;
    }
  }

  // Send a message to the current room
  sendMessage(event: string, data: any): void {
    if (!this.roomId) {
      throw new Error('Not in a room');
    }

    socketService.sendMessage(event, {
      ...data,
      roomId: this.roomId,
    });
  }

  // Listen for events
  on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)?.add(callback);
    
    // Register with socket service
    const unsubscribe = socketService.on(event, (...args: any[]) => {
      this.eventListeners.get(event)?.forEach(cb => cb(...args));
    });
    
    // Return function to unsubscribe
    return () => {
      this.eventListeners.get(event)?.delete(callback);
      unsubscribe();
    };
  }

  // Get current room ID
  getCurrentRoomId(): string | null {
    return this.roomId;
  }

  // Check if connected to a room
  isInRoom(): boolean {
    return this.roomId !== null && socketService.isConnected();
  }

  // Disconnect from socket server
  disconnect(): void {
    socketService.disconnect();
    this.roomId = null;
    this.eventListeners.clear();
  }
}

// Export as singleton
export const roomSocketService = new RoomSocketService();
