// ConflictException is used when email already exists.
// Injectable makes this class a Nest.js service.
// UnauthorizedException is used for invalid login or token.
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

// ConfigService reads values from backend/.env.
import { ConfigService } from '@nestjs/config';

// JwtService creates and verifies JWT tokens.
// JwtSignOptions gives correct TypeScript type for JWT options like expiresIn.
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';

// bcrypt is used to hash passwords and refresh tokens.
import * as bcrypt from 'bcrypt';

// UsersService handles user database logic.
import { UsersService } from '../users/users.service';

// JwtPayload defines what data we store inside JWT token.
import { JwtPayload } from './types/jwt-payload.type';

// @Injectable means Nest.js can inject this service into controllers/modules.
@Injectable()

// AuthService contains authentication business logic.
export class AuthService {
  // Constructor injects services needed by auth.
  constructor(
    // Used to find, create, and update users.
    private readonly usersService: UsersService,

    // Used to sign and verify JWT tokens.
    private readonly jwtService: JwtService,

    // Used to read .env variables.
    private readonly configService: ConfigService,
  ) {}

  // register() creates a new user account.
  async register(data: { name: string; email: string; password: string }) {
    // Check if email already exists in database.
    const existingUser = await this.usersService.findByEmail(data.email);

    // If email exists, stop registration.
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Read bcrypt salt rounds from .env.
    const saltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') || 12,
    );

    // Hash plain password before saving to database.
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Create user in database.
    const user = await this.usersService.createUser({
      name: data.name,
      email: data.email,
      password: passwordHash,
    });

    // Generate access token and refresh token.
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Save hashed refresh token in database.
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Return safe response to controller.
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.safeUser(user),
    };
  }

  // login() logs in user with email and password.
  async login(data: { email: string; password: string }) {
    // Find user by email and include hidden password column.
    const user = await this.usersService.findByEmailWithPassword(data.email);

    // If user does not exist, throw generic error.
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare plain password with hashed password.
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    // If password is wrong, throw generic error.
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate new tokens.
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Save latest refresh token hash in database.
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Return access token, refresh token, and safe user.
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.safeUser(user),
    };
  }

  // refresh() creates new tokens using refresh token cookie.
  async refresh(refreshToken: string) {
    // Read refresh token secret from .env.
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    // Stop if refresh secret is missing.
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is missing');
    }

    // This variable will store decoded JWT payload.
    let payload: JwtPayload;

    try {
      // Verify refresh token signature and expiry.
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      // If token is invalid or expired, block request.
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find user and include hidden refreshTokenHash column.
    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);

    // If user or refresh token hash does not exist, block request.
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Compare refresh token with saved hash.
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    // If token does not match saved hash, block request.
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens.
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Save new refresh token hash.
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Return new access token and safe user.
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.safeUser(user),
    };
  }

  // logout() removes refresh token hash from database.
  async logout(userId: string) {
    // Set refresh token hash to null.
    await this.usersService.updateRefreshTokenHash(userId, null);

    // Return success message.
    return {
      message: 'Logged out successfully',
    };
  }

  // generateTokens() creates access token and refresh token.
private async generateTokens(payload: JwtPayload) {
  // Read access token secret from .env.
  const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

  // Read refresh token secret from .env.
  const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

  // If secrets are missing, stop backend.
  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets are missing');
  }

  // Read access token expiry from .env.
  // Example value: 15m
  // Type cast is needed because JWT package expects a strict expiresIn type.
  const accessExpiresIn = (
    this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m'
  ) as JwtSignOptions['expiresIn'];

  // Read refresh token expiry from .env.
  // Example value: 7d
  // Type cast is needed for the same reason.
  const refreshExpiresIn = (
    this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d'
  ) as JwtSignOptions['expiresIn'];

  // Create short-life access token.
  // Frontend will send this token in Authorization header.
  const accessToken = await this.jwtService.signAsync(payload, {
    // Secret used to sign access token.
    secret: accessSecret,

    // Expiry time of access token.
    expiresIn: accessExpiresIn,
  });

  // Create long-life refresh token.
  // This token will be stored in HTTP-only cookie.
  const refreshToken = await this.jwtService.signAsync(payload, {
    // Secret used to sign refresh token.
    secret: refreshSecret,

    // Expiry time of refresh token.
    expiresIn: refreshExpiresIn,
  });

  // Return both tokens.
  return {
    accessToken,
    refreshToken,
  };
}

  // saveRefreshToken() hashes refresh token before storing.
  private async saveRefreshToken(userId: string, refreshToken: string) {
    // Read bcrypt salt rounds from .env.
    const saltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') || 12,
    );

    // Hash refresh token.
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);

    // Save refresh token hash in database.
    await this.usersService.updateRefreshTokenHash(userId, refreshTokenHash);
  }

  // safeUser() removes sensitive fields before sending user to frontend.
  private safeUser(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    // Return only safe user data.
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}