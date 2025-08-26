export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserAuth {
  username: string;
  password: string;
  id: string;
}

export interface User {
  id: string;
  username: string;
}

export interface CreateRoomRequest {
  password: string;
}

export interface CreateRoomResponse {
  id: string;
  message?: string;
}

export interface JoinRoomRequest {
  password: string;
}

export interface JoinRoomResponse {
  success: boolean;
  message?: string;
}

export interface RoomDetails {
  id: string;
  players: string[];
  hostUserId: string;
  // isGame: boolean;
  maxPlayers: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface LoginResponse {
  access_token: string;
}
