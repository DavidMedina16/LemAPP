import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  userId: number;
  email: string;
  role: string;
}

/** Extrae el usuario autenticado (inyectado por JwtStrategy) del request. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
