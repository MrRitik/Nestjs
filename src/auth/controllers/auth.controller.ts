import {
  Body,
  Controller,
  Post,
  Logger,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthDto, TokenResponseDto, RefreshTokenDto } from '../dto';
import { AuthGuard } from '../guards/auth.guard';
import { Request } from 'express';
import { IJwtPayload } from '../interface/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { RefreshAuthGuard } from '../guards';
import { ApiKeyGuard } from 'src/api-key/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() authDto: AuthDto): Promise<TokenResponseDto> {
    return this.authService.login(authDto.username, authDto.password);
  }

  @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  async refresh(
    @Req() req: Request & { user: { id: string; username: string } },
    @Body() refreshDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshTokens(req.user.id, refreshDto.refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request & { user: IJwtPayload }): IJwtPayload {
    return this.authService.getCurrentUser(req.user);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request & { user: IJwtPayload }) {
    return this.authService.logout(req.user.sub);
  }
}
