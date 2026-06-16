// Injectable allows this guard to be used by Nest.js.
import { Injectable } from '@nestjs/common';

// AuthGuard comes from Nest Passport package.
// It connects our route with passport strategy.
import { AuthGuard } from '@nestjs/passport';

// @Injectable means Nest.js can create this guard.
@Injectable()

// JwtAuthGuard protects APIs.
// It uses the JWT strategy created in jwt.strategy.ts.
export class JwtAuthGuard extends AuthGuard('jwt') {}