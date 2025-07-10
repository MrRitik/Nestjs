import { JwtModuleOptions } from '@nestjs/jwt';
import * as dotenv from 'dotenv';

dotenv.config();

export const refreshJwtConfig: JwtModuleOptions = {
  secret: process.env.REFRESH_JWT_SECRET,
  signOptions: {
    expiresIn: '7d',
  },
};
