// Import Role enum.
// This makes sure JWT role value can only be "user" or "admin".
import { Role } from '../../common/enums/role.enum';

// This type defines what data we store inside JWT token.
// JWT token will be created after login/register.
export type JwtPayload = {
  // sub means "subject".
  // Standard JWT practice is to store user id in sub.
  sub: string;

  // Store user's email inside token.
  // Useful for identifying user without another database query.
  email: string;

  // Store user's role inside token.
  // This helps us protect admin/user routes.
  role: Role;
};