import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/services/users.service';
import * as bcrypt from 'bcrypt';
import { IJwtPayload } from '../interface/jwt-payload.interface';
import { TokenResponseDto } from '../dto';
import { refreshJwtConfig } from '../config/refresh-jwt.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private calculateRefreshTokenExpiry(): Date {
    // Parse the expiresIn value from JWT config (e.g., '7d' -> 7 days)
    const expiresIn = refreshJwtConfig.signOptions?.expiresIn ?? '7d';

    if (typeof expiresIn === 'string') {
      const match = expiresIn.match(/^(\d+)([smhd])$/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];

        const multipliers = {
          s: 1000, // seconds
          m: 60 * 1000, // minutes
          h: 60 * 60 * 1000, // hours
          d: 24 * 60 * 60 * 1000, // days
        };

        return new Date(Date.now() + value * multipliers[unit]);
      }
    }

    // Default to 7 days if parsing fails
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

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

      // Calculate expiry time based on refresh token configuration
      const expiryTime = this.calculateRefreshTokenExpiry();

      // Store refresh token in DB with expiry time
      await this.usersService.updateUserRefreshToken(
        user.id,
        refreshToken,
        expiryTime,
      );

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

  validateToken(token: string): IJwtPayload {
    try {
      const payload = this.jwtService.verify<IJwtPayload>(token);
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
    userId: string,
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

      // Calculate expiry time based on refresh token configuration
      const expiryTime = this.calculateRefreshTokenExpiry();

      await this.usersService.updateUserRefreshToken(
        user.id,
        newRefreshToken,
        expiryTime,
      );

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

  getCurrentUser(user: IJwtPayload): IJwtPayload {
    this.logger.log(`Getting current user info for user ID: ${user.sub}`);
    return user;
  }

  async logout(userId: string): Promise<{ message: string }> {
    try {
      this.logger.log(`Logging out user ID: ${userId}`);

      // Clear the refresh token from database
      await this.usersService.clearUserRefreshToken(userId);

      this.logger.log(`Successfully logged out user ID: ${userId}`);
      return { message: 'Successfully logged out' };
    } catch (error: unknown) {
      this.logger.error(
        `Logout failed for user ID: ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Logout failed');
    }
  }
}
