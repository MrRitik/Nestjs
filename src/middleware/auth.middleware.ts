import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface RequestWithSkipApiKeyCheck extends Request {
  skipApiKeyCheck?: boolean;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Auth Middleware');
  public use(
    req: RequestWithSkipApiKeyCheck,
    res: Response,
    next: NextFunction,
  ) {
    if (req.path === '/auth/logout') {
      req.skipApiKeyCheck = true;
      return next();
    }
    this.logger.log(`Request recived: ${req.method} ${req.originalUrl}`);
    next();
  }
}
