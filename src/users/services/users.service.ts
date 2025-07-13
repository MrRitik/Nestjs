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

  async getUserById(id: string) {
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
  findUserById(id: string) {
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
    id: string,
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

  async deleteUser(id: string): Promise<{ message: string }> {
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

  async updateUserRefreshToken(
    id: string,
    refreshToken: string,
    expiryTime?: Date,
  ) {
    this.logger.log(`Updating refresh token for user ID: ${id}`);
    const hashedToken = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);

    // Calculate expiry time if not provided (default to 7 days from now)
    const expiry = expiryTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.userRepository.update(
      { id },
      {
        refreshToken: hashedToken,
        expiryIn: expiry,
      },
    );
  }

  async isRefreshTokenValid(
    id: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.findUserById(id);
    if (!user || !user.refreshToken) return false;

    // Check if token is expired
    if (user.expiryIn && new Date() > user.expiryIn) {
      this.logger.warn(`Refresh token expired for user ID: ${id}`);
      return false;
    }

    // Check if token matches
    return bcrypt.compare(refreshToken, user.refreshToken);
  }

  async clearExpiredRefreshTokens(): Promise<number> {
    try {
      this.logger.log('Clearing expired refresh tokens');
      const result = await this.userRepository
        .createQueryBuilder()
        .update(UserEntity)
        .set({
          refreshToken: null,
          expiryIn: null,
        })
        .where('expiry_in IS NOT NULL AND expiry_in < :now', {
          now: new Date(),
        })
        .execute();

      const clearedCount = result.affected || 0;
      this.logger.log(`Cleared ${clearedCount} expired refresh tokens`);
      return clearedCount;
    } catch (error: unknown) {
      this.logger.error(
        'Failed to clear expired refresh tokens',
        (error as Error)?.stack,
      );
      throw new InternalServerErrorException(
        'Failed to clear expired refresh tokens',
      );
    }
  }

  async clearUserRefreshToken(id: string): Promise<void> {
    try {
      this.logger.log(`Clearing refresh token for user ID: ${id}`);

      // Set both refresh token and expiry to null
      await this.userRepository.update(
        { id },
        {
          refreshToken: null,
          expiryIn: null,
        },
      );

      this.logger.log(
        `Successfully cleared refresh token and expiry for user ID: ${id}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to clear refresh token for user ID: ${id}`,
        (error as Error)?.stack,
      );
      throw new InternalServerErrorException('Failed to clear refresh token');
    }
  }

  async getExpiredRefreshTokensCount(): Promise<number> {
    try {
      const count = await this.userRepository
        .createQueryBuilder('user')
        .where('user.expiry_in IS NOT NULL AND user.expiry_in < :now', {
          now: new Date(),
        })
        .getCount();

      return count;
    } catch (error: unknown) {
      this.logger.error(
        'Failed to get expired refresh tokens count',
        (error as Error)?.stack,
      );
      throw new InternalServerErrorException(
        'Failed to get expired refresh tokens count',
      );
    }
  }
}
