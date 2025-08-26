import { Controller, Get, Post, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { Public } from '../../auth/decorators/public.decorator';
import { GetCurrentUser, CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Create new user',
    description: 'Register a new user with username and password'
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration data'
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User
  })
  @ApiResponse({
    status: 409,
    description: 'Username already exists'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user\'s profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: User
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  async getCurrentUser(@GetCurrentUser() currentUser: CurrentUser): Promise<User> {
    return this.usersService.findOne(currentUser.userId);
  }

  @Delete('me')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete current user',
    description: 'Delete the authenticated user\'s account'
  })
  @ApiResponse({
    status: 204,
    description: 'User account deleted successfully'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  async removeCurrentUser(@GetCurrentUser() currentUser: CurrentUser): Promise<void> {
    return this.usersService.remove(currentUser.userId);
  }
}