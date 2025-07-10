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
import { AuthDto, TokenResponseDto, RefreshTokenDto } from './dto';
import { AuthGuard } from '../common/gaurds/auth.gaurd';
import { Request } from 'express';
import { JwtPayload } from './interface/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { RefreshAuthGuard } from 'src/common/gaurds';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() authDto: AuthDto): Promise<TokenResponseDto> {
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
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Login failed');
    }
  }

  @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  async refresh(
    @Req() req: Request & { user: { id: number; username: string } },
    @Body() refreshDto: RefreshTokenDto,
  ) {
    const user = req.user;
    const refreshToken = refreshDto.refreshToken;
    return await this.authService.refreshTokens(user.id, refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request & { user: JwtPayload }) {
    // req.user is set by JwtStrategy
    return req.user;
  }
}
