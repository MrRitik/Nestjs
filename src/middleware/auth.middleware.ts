import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Auth Middleware');
  public use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/auth/logout') {
      return next();
    }
    this.logger.log(`Request recived: ${req.method} ${req.originalUrl}`);
    next();
  }
}
