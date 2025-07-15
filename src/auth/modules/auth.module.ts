import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UsersModule } from 'src/users/modules/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConfig } from '../config/jwt.config';
import { AuthController } from '../controllers/auth.controller';
import { JwtStrategy, RefreshJwtStrategy } from '../strategies';
import { AuthMiddleware } from 'src/middleware/auth.middleware';

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register(jwtConfig)],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshJwtStrategy],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
