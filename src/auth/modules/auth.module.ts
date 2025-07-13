import { Module } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UsersModule } from 'src/users/modules/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConfig } from '../config/jwt.config';
import { AuthController } from '../controllers/auth.controller';
import { JwtStrategy, RefreshJwtStrategy } from '../strategies';

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register(jwtConfig)],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshJwtStrategy],
})
export class AuthModule {}
