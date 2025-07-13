import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { AuthDto, TokenResponseDto, RefreshTokenDto } from '../dto';
import { Request } from 'express';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { RefreshAuthGuard } from '../guards';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() authDto: AuthDto): Promise<TokenResponseDto> {
    return await this.authService.login(authDto.username, authDto.password);
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
    return this.authService.getCurrentUser(req.user);
  }
}
