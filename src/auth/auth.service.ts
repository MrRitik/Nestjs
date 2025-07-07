import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/services/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    try {
      this.logger.log(`Attempting login for username: ${username}`);

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

      const payload = { username: user.username, id: user.id };
      const access_token = this.jwtService.sign(payload);

      this.logger.log(`Successfully generated token for user: ${username}`);
      return { access_token };
    } catch (error: unknown) {
      this.logger.error(
        `Login failed for username: ${username}`,
        (error as Error).stack,
      );

      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw auth-specific exceptions
      }

      throw new InternalServerErrorException('Login processing failed');
    }
  }
}
