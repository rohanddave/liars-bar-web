import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const payload = { 
      username: loginDto.username,
      sub: loginDto.username 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}