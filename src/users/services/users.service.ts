import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { ICreateUser, IUpdateUser } from '../interfaces/user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async getAllUsers() {
    try {
      this.logger.log('Fetching all users');
      const users = await this.userRepository.find();
      return plainToInstance(UserEntity, users, {
        excludeExtraneousValues: true,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to fetch users', (error as Error)?.stack);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async getUserById(id: number) {
    try {
      this.logger.log(`Fetching user with ID: ${id}`);
      const user = await this.userRepository.findOne({ where: { id } });

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

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async getUserByUsername(username: string) {
    try {
      this.logger.log(`Fetching user with username: ${username}`);
      const user = await this.userRepository.findOne({ where: { username } });

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

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  // Internal method for auth service (returns full user with password)
  findUserByUsername(username: string) {
    this.logger.log(`Retrieving user with username: ${username}`);
    return this.userRepository.findOne({ where: { username } });
  }

  // Internal method for auth service (returns full user)
  findUserById(id: number) {
    this.logger.log(`Retrieving user with ID: ${id}`);
    return this.userRepository.findOne({ where: { id } });
  }

  async createUser(
    userDetail: ICreateUser,
  ): Promise<{ message: string; data: Omit<UserEntity, 'password'> }> {
    try {
      this.logger.log('Creating a new user');

      const existingUser = await this.findUserByUsername(userDetail.username);
      if (existingUser) {
        this.logger.warn(
          `User with username ${userDetail.username} already exists`,
        );
        throw new ConflictException('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(
        userDetail.password,
        this.SALT_ROUNDS,
      );
      const newUser = this.userRepository.create({
        ...userDetail,
        password: hashedPassword,
        createdAt: new Date(),
      });
      const savedUser = await this.userRepository.save(newUser);

      // Exclude password from returned user
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = savedUser;

      return {
        message: 'User created successfully',
        data: plainToInstance(UserEntity, result, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error: unknown) {
      this.logger.error('Failed to create user', (error as Error)?.stack);

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateUser(
    id: number,
    updateUserDto: IUpdateUser,
  ): Promise<{ message: string }> {
    try {
      this.logger.log(`Updating user with ID: ${id}`);
      const result = await this.userRepository.update(
        { id },
        { ...updateUserDto },
      );

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

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    try {
      this.logger.log(`Deleting user with ID: ${id}`);
      const result = await this.userRepository.delete({ id });

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

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async updateUserRefreshToken(id: number, refreshToken: string) {
    this.logger.log(`Updating refresh token for user ID: ${id}`);
    const hashedToken = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);
    await this.userRepository.update({ id }, { refreshToken: hashedToken });
  }

  async isRefreshTokenValid(
    id: number,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.findUserById(id);
    if (!user || !user.refreshToken) return false;
    return bcrypt.compare(refreshToken, user.refreshToken);
  }
}
