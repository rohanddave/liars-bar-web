export interface LoginRequest{
  username: string;
  password: string;
}

export interface UserAuth{
  username: string;
  password: string;
  id: string;
}

export interface User{
  id: string;
  username: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface CreateRoomRequest {
  password: string;
}

export interface CreateRoomResponse {
  roomId: string;
  message?: string;
}

export interface JoinRoomRequest{
  password: string;
}

export interface JoinRoomResponse{
  success: boolean;
  message?: string;
}

export interface roomDetails{
  roomId: string;
  players: string[];
  isGame: boolean;
  maxPlayers: number;
}

export interface ApiError{
  message: string;
  statusCode?: number;
}
