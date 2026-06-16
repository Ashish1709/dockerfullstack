// Injectable allows this class to be used by Nest.js dependency injection.
import { Injectable } from '@nestjs/common';

// ConfigService reads values from backend/.env file.
import { ConfigService } from '@nestjs/config';

// PassportStrategy connects Nest.js with Passport authentication.
import { PassportStrategy } from '@nestjs/passport';

// ExtractJwt reads JWT token from request header.
// Strategy is the JWT strategy from passport-jwt.
import { ExtractJwt, Strategy } from 'passport-jwt';

// Import our JWT payload type.
// This defines what data exists inside the JWT token.
import { JwtPayload } from '../types/jwt-payload.type';

// @Injectable means Nest.js can create and use this class.
@Injectable()

// This class verifies JWT access tokens.
// PassportStrategy(Strategy) means we are using passport-jwt strategy.
export class JwtStrategy extends PassportStrategy(Strategy) {
  // constructor runs when Nest.js starts this strategy.
  constructor(configService: ConfigService) {
    // Read JWT_ACCESS_SECRET from backend/.env.
    const secret = configService.get<string>('JWT_ACCESS_SECRET');

    // If JWT secret is missing, stop backend.
    // This is important because JWT without secret is insecure.
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is missing');
    }

    // super() sends configuration to passport-jwt.
    super({
      // This tells Passport to read token from:
      // Authorization: Bearer your_token_here
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // This secret verifies that token is real and not changed.
      secretOrKey: secret,
    });
  }

  // validate() runs after JWT token is successfully verified.
  // payload contains decoded token data.
  validate(payload: JwtPayload) {
    // Whatever we return here becomes request.user.
    return {
      // id is taken from payload.sub.
      id: payload.sub,

      // email is taken from JWT payload.
      email: payload.email,

      // role is taken from JWT payload.
      role: payload.role,
    };
  }
}