import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { refreshJwtConfig } from 'src/auth/config/refresh-jwt.config';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: refreshJwtConfig.secret,
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: { sub: number; username: string }) {
    const body = req.body as Record<string, any>;
    let refreshToken: string | undefined = undefined;
    if (body && typeof body.refreshToken === 'string') {
      refreshToken = body.refreshToken;
    }
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const user = await this.usersService.findUserById(payload.sub);
    const isValid = await this.usersService.isRefreshTokenValid(
      payload.sub,
      refreshToken,
    );
    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { id: user.id, username: user.username };
  }
}
