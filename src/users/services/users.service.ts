import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
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

  findUsers() {
    this.logger.log('Retrieving all users from the database');
    return this.userRepository.find();
  }

  findUserById(id: number) {
    this.logger.log(`Retrieving user with ID: ${id}`);
    return this.userRepository.findOne({ where: { id } });
  }

  findUserByUsername(username: string) {
    this.logger.log(`Retrieving user with username: ${username}`);
    return this.userRepository.findOne({ where: { username } });
  }

  async createUser(
    userDetail: ICreateUser,
  ): Promise<Omit<UserEntity, 'password'>> {
    this.logger.log(`Creating user with username: ${userDetail.username}`);
    const existingUser = await this.findUserByUsername(userDetail.username);
    if (existingUser) {
      this.logger.warn(
        `User with username ${userDetail.username} already exists`,
      );
      throw new ConflictException('Username already exists');
    }
    try {
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
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create user: ${error.message}`,
          error.stack,
        );
        throw new ConflictException('Failed to create user');
      } else {
        this.logger.error('Failed to create user: Unknown error');
        throw new ConflictException('Failed to create user');
      }
    }
  }

  async updateUser(id: number, updateUserDto: IUpdateUser) {
    this.logger.log(`Updating user with ID: ${id}`);
    return this.userRepository.update({ id }, { ...updateUserDto });
  }

  async deleteUser(id: number) {
    this.logger.log(`Deleting user with ID: ${id}`);
    return this.userRepository.delete({ id });
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
