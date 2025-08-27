'use client';

import { io, Socket } from 'socket.io-client';
import { getToken } from './util';

const SOCKET_URL = 'http://localhost:3001';

export interface RoomEventData {
  roomId: string;
  userId?: string;
  socketId?: string;
  message?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    // Don't auto-connect in constructor to avoid SSR issues
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        setTimeout(() => resolve(this.connect()), 100);
        return;
      }

      const token = getToken();
      if (!token) {
        reject(new Error('Authentication required. Please log in first.'));
        return;
      }

      this.isConnecting = true;
      console.log('Connecting to WebSocket...');

      this.socket = io(`${SOCKET_URL}/rooms`, {
        auth: { token },
        query: { token },
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
      });

      this.setupEventListeners(resolve, reject);
    });
  }

  private setupEventListeners(resolve?: (socket: Socket) => void, reject?: (error: Error) => void) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      resolve?.(this.socket!);
    });

    this.socket.on('connection_established', (data) => {
      console.log('🔌 Connection established:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket:', reason);
      this.isConnecting = false;
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error);
      this.isConnecting = false;
      
      if (reject) {
        reject(error);
      } else {
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ WebSocket error:', error);
    });

    // Room event listeners
    this.socket.on('user_joined_room', (data: RoomEventData) => {
      console.log('👤 User joined room:', data);
    });

    this.socket.on('user_left_room', (data: RoomEventData) => {
      console.log('👋 User left room:', data);
    });

    this.socket.on('room_state', (data) => {
      console.log('🏠 Room state update:', data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(console.error);
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Room operations
  async joinRoom(roomId: string): Promise<{ success: boolean; message: string }> {
    if (!this.socket?.connected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for room join response'));
      }, 5000);

      this.socket.emit('join_room', { roomId }, (response: any) => {
        clearTimeout(timeout);
        if (response?.success !== false) {
          resolve(response || { success: true, message: 'Joined room successfully' });
        } else {
          reject(new Error(response?.message || 'Failed to join room'));
        }
      });
    });
  }

  async leaveRoom(roomId: string): Promise<void> {
    if (!this.socket?.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(); // Don't fail on timeout for leave
      }, 3000);

      this.socket!.emit('leave_room', { roomId }, () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  // Event listeners
  onUserJoinedRoom(callback: (data: RoomEventData) => void) {
    this.socket?.on('user_joined_room', callback);
    return () => this.socket?.off('user_joined_room', callback);
  }

  onUserLeftRoom(callback: (data: RoomEventData) => void) {
    this.socket?.on('user_left_room', callback);
    return () => this.socket?.off('user_left_room', callback);
  }

  onRoomState(callback: (data: any) => void) {
    this.socket?.on('room_state', callback);
    return () => this.socket?.off('room_state', callback);
  }

  onError(callback: (error: any) => void) {
    this.socket?.on('error', callback);
    return () => this.socket?.off('error', callback);
  }

  // Game event listeners
  onGameStarted(callback: (data: any) => void) {
    this.socket?.on('GAME_STARTED', callback);
    return () => this.socket?.off('GAME_STARTED', callback);
  }

  onGameEnded(callback: (data: any) => void) {
    this.socket?.on('GAME_ENDED', callback);
    return () => this.socket?.off('GAME_ENDED', callback);
  }

  // Utility methods
  get connected() {
    return this.socket?.connected || false;
  }

  emit(event: string, data: any, callback?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data, callback);
    } else {
      console.warn('⚠️ Cannot emit event, socket not connected:', event);
    }
  }

  off(event: string, callback?: any) {
    this.socket?.off(event, callback);
  }
}

// Create singleton instance
let socketService: SocketService | null = null;

export function getSocketService(): SocketService {
  if (typeof window === 'undefined') {
    // Return a mock service for SSR
    return {
      connect: () => Promise.reject(new Error('Socket not available in SSR')),
      disconnect: () => {},
      joinRoom: () => Promise.reject(new Error('Socket not available in SSR')),
      leaveRoom: () => Promise.resolve(),
      connected: false,
      emit: () => {},
      off: () => {},
      onUserJoinedRoom: () => () => {},
      onUserLeftRoom: () => () => {},
      onRoomState: () => () => {},
      onError: () => () => {},
      onGameStarted: () => () => {},
      onGameEnded: () => () => {},
    } as any;
  }

  if (!socketService) {
    socketService = new SocketService();
  }

  return socketService;
}

export default getSocketService;