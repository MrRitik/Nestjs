import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() authDto: AuthDto) {
    try {
      this.logger.log(`Login attempt for username: ${authDto.username}`);

      const result = await this.authService.login(
        authDto.username,
        authDto.password,
      );

      this.logger.log(`Successful login for username: ${authDto.username}`);
      return result;
    } catch (error: unknown) {
      this.logger.error(
        `Login failed for username: ${authDto.username}`,
        (error as Error).stack,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Login failed');
    }
  }
}
