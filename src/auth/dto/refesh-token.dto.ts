import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class TokenResponseDto {
  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;
}
