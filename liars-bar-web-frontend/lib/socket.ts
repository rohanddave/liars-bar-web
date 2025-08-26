import { io, Socket } from 'socket.io-client';
import { getToken } from './util';

class SocketService {
    private socket: Socket | null = null;
    private roomId: string | null = null;

    // Connect to WebSocket with authentication
    connect() {
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        const token = getToken();
        if (!token) {
            throw new Error('Authentication required. Please log in first.');
        }

        // Connect with token in query params
        this.socket = io('http://localhost:3001/rooms', {
            query: { token },
            transports: ['websocket'],
            autoConnect: true,
        });

        this.setupListeners();
        return this.socket;
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.roomId = null;
        }
    }

    // Join a room
    joinRoom(roomId: string) {
        if (!this.socket || !this.socket.connected) {
            throw new Error('Socket not connected. Please connect first.');
        }

        return new Promise<void>((resolve, reject) => {
            this.socket!.emit('join_room', { roomId }, (response: any) => {
                if (response.success) {
                    this.roomId = roomId;
                    resolve();
                } else {
                    reject(new Error(response.message || 'Failed to join room'));
                }
            });
        });
    }

    // Leave current room
    leaveRoom() {
        if (!this.socket || !this.socket.connected || !this.roomId) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            this.socket!.emit('leave_room', { roomId: this.roomId }, (response: any) => {
                if (response.success) {
                    this.roomId = null;
                    resolve();
                } else {
                    reject(new Error(response.message || 'Failed to leave room'));
                }
            });
        });
    }

    // Send a message to the current room
    sendMessage(event: string, data: any) {
        if (!this.socket || !this.socket.connected) {
            throw new Error('Socket not connected. Please connect first.');
        }

        this.socket.emit(event, data);
    }

    // Listen for events
    on(event: string, callback: (...args: any[]) => void) {
        if (!this.socket) {
            throw new Error('Socket not initialized. Please connect first.');
        }

        this.socket.on(event, callback);
        return () => this.socket?.off(event, callback);
    }

    // Check if socket is connected
    isConnected(): boolean {
        return !!this.socket && this.socket.connected;
    }

    // Get current room ID
    getCurrentRoom(): string | null {
        return this.roomId;
    }

    // Setup default listeners
    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.roomId = null;
        });

        this.socket.on('error', (error: any) => {
            console.error('Socket error:', error);
        });

        this.socket.on('connection_established', (data: any) => {
            console.log('Connection established:', data);
        });
    }
}

// Export as singleton
export const socketService = new SocketService();