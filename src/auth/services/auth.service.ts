import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/services/users.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { TokenResponseDto } from '../dto';
import { refreshJwtConfig } from '../config/refresh-jwt.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<TokenResponseDto> {
    try {
      this.logger.log(`Login attempt for username: ${username}`);

      const user = await this.usersService.findUserByUsername(username);

      if (!user) {
        this.logger.warn(`User not found: ${username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { username: user.username, sub: user.id };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        secret: refreshJwtConfig.secret,
        expiresIn: refreshJwtConfig.signOptions?.expiresIn ?? 3600,
      });

      // Store refresh token in DB
      await this.usersService.updateUserRefreshToken(user.id, refreshToken);

      this.logger.log(`Successful login for username: ${username}`);
      return { accessToken, refreshToken };
    } catch (error: unknown) {
      this.logger.error(
        `Login failed for username: ${username}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Login failed');
    }
  }

  validateToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token');
      }
      return payload;
    } catch {
      this.logger.warn('Token validation failed');
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refreshTokens(
    userId: number,
    refreshToken: string,
  ): Promise<TokenResponseDto> {
    try {
      this.logger.log(`Refreshing tokens for user ID: ${userId}`);

      const user = await this.usersService.findUserById(userId);
      const isValid = await this.usersService.isRefreshTokenValid(
        userId,
        refreshToken,
      );

      if (!user || !isValid) {
        this.logger.warn(`Invalid refresh token for user ID: ${userId}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = { username: user.username, sub: user.id };
      const accessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(payload, {
        secret: refreshJwtConfig.secret,
        expiresIn: refreshJwtConfig.signOptions?.expiresIn ?? 3600,
      });

      await this.usersService.updateUserRefreshToken(user.id, newRefreshToken);

      this.logger.log(`Successfully refreshed tokens for user ID: ${userId}`);
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error: unknown) {
      this.logger.error(
        `Token refresh failed for user ID: ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Could not refresh tokens');
    }
  }

  getCurrentUser(user: JwtPayload): JwtPayload {
    this.logger.log(`Getting current user info for user ID: ${user.sub}`);
    return user;
  }
}
