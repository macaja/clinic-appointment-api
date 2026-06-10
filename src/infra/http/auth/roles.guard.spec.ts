import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const makeContext = (role: string | undefined, requiredRoles: string[]) => {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles as never);

  const guard = new RolesGuard(reflector);

  const headers: Record<string, string> = {};
  if (role !== undefined) headers['x-role'] = role;

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ headers, query: {} }),
    }),
  } as never;

  return { guard, context };
};

describe('RolesGuard', () => {
  it('should allow when no roles metadata is set', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([] as never);
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ headers: {}, query: {} }) }),
    } as never;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when role matches required roles', () => {
    const { guard, context } = makeContext('admin', ['admin', 'patient']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when role is not in required set', () => {
    const { guard, context } = makeContext('clinician', ['patient', 'admin']);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when X-Role header is missing', () => {
    const { guard, context } = makeContext(undefined, ['admin']);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should fall back to query param role when X-Role header is absent', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'] as never);
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {}, query: { role: 'admin' } }),
      }),
    } as never;

    expect(guard.canActivate(context)).toBe(true);
  });
});
