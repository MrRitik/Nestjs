import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { AuthGuard } from '../common/gaurds/auth.gaurd';
import { Request } from 'express';
import { JwtPayload } from './interface/jwt-payload.interface';

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

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request & { user: JwtPayload }) {
    // req.user is set by JwtStrategy
    return req.user;
  }
}
