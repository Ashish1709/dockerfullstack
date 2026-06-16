// Module decorator creates a Nest.js module.
import { Module } from '@nestjs/common';

// JwtModule provides JwtService.
// JwtService is used in AuthService to create and verify JWT tokens.
import { JwtModule } from '@nestjs/jwt';

// PassportModule enables Passport authentication support in Nest.js.
// We use it with JwtStrategy and JwtAuthGuard.
import { PassportModule } from '@nestjs/passport';

// UsersModule gives AuthModule access to UsersService.
// AuthService needs UsersService for register, login, and refresh token logic.
import { UsersModule } from '../users/users.module';

// AuthController contains all auth API routes.
// Example: /auth/register, /auth/login, /auth/me.
import { AuthController } from './auth.controller';

// AuthService contains the main authentication business logic.
// Example: password hash, token generation, login validation.
import { AuthService } from './auth.service';

// JwtStrategy verifies JWT access tokens from Authorization header.
import { JwtStrategy } from './strategies/jwt.strategy';

// @Module groups all auth-related files together.
@Module({
  // imports are modules needed by this AuthModule.
  imports: [
    // Needed because AuthService uses UsersService.
    UsersModule,

    // Enables Passport authentication.
    PassportModule,

    // Registers JwtService.
    // We pass JWT secrets manually in AuthService, so empty config is okay.
    JwtModule.register({}),
  ],

  // controllers are files that create API endpoints.
  // Without this line, /auth/register will not exist.
  controllers: [AuthController],

  // providers are services/strategies used inside this module.
  providers: [
    // Register AuthService so AuthController can use it.
    AuthService,

    // Register JwtStrategy so JwtAuthGuard can verify tokens.
    JwtStrategy,
  ],
})
export class AuthModule {}