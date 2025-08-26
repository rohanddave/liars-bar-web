import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { LoginDto } from '../dto/login.dto';
import { Public } from '../decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user with username and password (encrypted by client) and return JWT token'
  })
  @ApiBody({
    type: LoginDto,
    description: 'User credentials with encrypted password'
  })
  @ApiResponse({
    status: 201,
    description: 'Login successful, JWT token returned',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT access token'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials'
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('logout')
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user (currently no server-side action required)'
  })
  @ApiResponse({
    status: 201,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logged out successfully'
        }
      }
    }
  })
  async logout() {
    return { message: 'Logged out successfully' };
  }
}