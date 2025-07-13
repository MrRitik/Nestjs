import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['api-key'] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing.');
    }

    // call your env. var the name you want
    if (apiKey !== process.env.API_KEY) {
      throw new UnauthorizedException('Invalid API key.');
    }

    return true;
  }
}
