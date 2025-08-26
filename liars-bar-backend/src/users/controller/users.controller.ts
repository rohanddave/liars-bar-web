import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { Public } from '../../auth/decorators/public.decorator';

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

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve user information by user ID (requires authentication)'
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: User
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete user by ID (requires authentication)'
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}