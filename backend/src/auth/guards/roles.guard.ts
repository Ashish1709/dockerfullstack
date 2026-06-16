// CanActivate is used to create a Nest.js guard.
// ExecutionContext gives access to request, controller, and route.
// Injectable allows Nest.js to inject/use this guard.
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// Reflector is used to read metadata from decorators like @Roles().
import { Reflector } from '@nestjs/core';

// Import Role enum so role values are controlled.
import { Role } from '../../common/enums/role.enum';

// Import ROLES_KEY from roles.decorator.ts.
// This key is used to read roles from @Roles().
import { ROLES_KEY } from '../decorators/roles.decorator';

// @Injectable means Nest.js can create this guard.
@Injectable()

// RolesGuard checks if logged-in user role is allowed.
export class RolesGuard implements CanActivate {
  // Inject Reflector so we can read @Roles() metadata.
  constructor(private readonly reflector: Reflector) {}

  // canActivate decides if request should continue or be blocked.
  canActivate(context: ExecutionContext): boolean {
    // Read roles from route/controller.
    // Example: @Roles(Role.Admin)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      // Check role metadata on method.
      context.getHandler(),

      // Check role metadata on controller.
      context.getClass(),
    ]);

    // If no @Roles() is added, allow the request.
    if (!requiredRoles) {
      return true;
    }

    // Get HTTP request object.
    const request = context.switchToHttp().getRequest();

    // Get logged-in user from request.
    // This comes from JwtStrategy validate().
    const user = request.user;

    // Allow request only if user's role exists in requiredRoles.
    return requiredRoles.includes(user?.role);
  }
}