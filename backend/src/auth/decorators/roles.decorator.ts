// SetMetadata allows us to attach custom data to route handlers.
import { SetMetadata } from '@nestjs/common';

// Import Role enum.
// Role can be "user" or "admin".
import { Role } from '../../common/enums/role.enum';

// This is the metadata key name.
// RolesGuard will use this key to read required roles.
export const ROLES_KEY = 'roles';

// Roles decorator is used like:
// @Roles(Role.Admin)
// It stores allowed roles on an API route.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);