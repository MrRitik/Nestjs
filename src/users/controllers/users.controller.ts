import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersService } from '../services/users.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private usersService: UsersService) {}

  @Get()
  async getUsers() {
    try {
      this.logger.log('Fetching all users');
      const users = await this.usersService.findUsers();
      return plainToInstance(UserEntity, users, {
        excludeExtraneousValues: true,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to fetch users', (error as Error)?.stack);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Fetching user with ID: ${id}`);
      const user = await this.usersService.findUserById(id);
      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return plainToInstance(UserEntity, user, {
        excludeExtraneousValues: true,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch user with ID: ${id}`,
        (error as Error)?.stack,
      );
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    try {
      this.logger.log(`Fetching user with username: ${username}`);
      const user = await this.usersService.findUserByUsername(username);
      if (!user) {
        this.logger.warn(`User with username ${username} not found`);
        throw new NotFoundException(`User with username ${username} not found`);
      }
      return plainToInstance(UserEntity, user, {
        excludeExtraneousValues: true,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch user with username: ${username}`,
        (error as Error)?.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      this.logger.log('Creating a new user');
      const user = await this.usersService.createUser(createUserDto);
      return {
        message: 'User created successfully',
        data: plainToInstance(UserEntity, user, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error: unknown) {
      this.logger.error('Failed to create user', (error as Error)?.stack);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      this.logger.log(`Updating user with ID: ${id}`);
      const result = await this.usersService.updateUser(id, updateUserDto);
      if (result.affected === 0) {
        this.logger.warn(`User with ID ${id} not found for update`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return {
        message: 'User updated successfully',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update user with ID: ${id}`,
        (error as Error)?.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`Deleting user with ID: ${id}`);
      const result = await this.usersService.deleteUser(id);
      if (result.affected === 0) {
        this.logger.warn(`User with ID ${id} not found for deletion`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return {
        message: 'User deleted successfully',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to delete user with ID: ${id}`,
        (error as Error)?.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
