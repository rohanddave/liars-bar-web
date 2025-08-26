import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { UsersService } from 'src/users/service/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(loginDto: LoginDto) {
    let user = await this.usersService.findByUsername(loginDto.username);

    if (user && user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    } else if (!user) {
      user = await this.usersService.create({
        username: loginDto.username,
        password: loginDto.password,
      });
    }

    const payload = {
      username: loginDto.username,
      id: user.id,
      sub: loginDto.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
