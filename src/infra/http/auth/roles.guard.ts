import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; query: Record<string, string> }>();
    const role = (request.headers['x-role'] ?? request.query['role']) as Role | undefined;

    if (!role) {
      throw new ForbiddenException('X-Role header is required');
    }

    if (!required.includes(role)) {
      throw new ForbiddenException(`Role '${role}' is not allowed for this endpoint`);
    }

    return true;
  }
}
