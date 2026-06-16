// These decorators and classes come from Nest.js.
// Body reads request body.
// Controller creates a route group.
// Get creates GET API route.
// HttpCode sets custom HTTP status code.
// HttpStatus gives constants like 200 OK.
// Post creates POST API route.
// Req gives access to request object.
// Res gives access to response object.
// UnauthorizedException sends 401 error.
// UseGuards protects routes using guards.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

// Request and Response are only TypeScript types.
// import type fixes TS1272 error when decorators + emitDecoratorMetadata are enabled.
import type { Request, Response } from 'express';

// AuthService contains the real register, login, refresh, and logout logic.
import { AuthService } from './auth.service';

// CurrentUser decorator gives us logged-in user data from request.user.
import { CurrentUser } from './decorators/current-user.decorator';

// LoginDto validates POST /auth/login request body.
import { LoginDto } from './dto/login.dto';

// RegisterDto validates POST /auth/register request body.
import { RegisterDto } from './dto/register.dto';

// JwtAuthGuard protects routes using JWT access token.
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// This custom type tells TypeScript that request has cookies.
// cookie-parser adds cookies to request object.
type RequestWithCookies = Request & {
  cookies: {
    refresh_token?: string;
  };
};

// @Controller('auth') means every route in this controller starts with /auth.
// Example: @Post('register') becomes POST /auth/register.
@Controller('auth')
export class AuthController {
  // Constructor injects AuthService into this controller.
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  // This API registers a new user.
  @Post('register')
  async register(
    // @Body() reads JSON body from frontend.
    // RegisterDto validates name, email, and password.
    @Body() body: RegisterDto,

    // @Res({ passthrough: true }) gives response object.
    // passthrough true lets us set cookie and still return normal JSON.
    @Res({ passthrough: true }) response: Response,
  ) {
    // Call AuthService register method.
    const result = await this.authService.register(body);

    // Save refresh token in HTTP-only cookie.
    // This is safer than storing refresh token in localStorage.
    this.setRefreshTokenCookie(response, result.refreshToken);

    // Return access token and user data to frontend.
    // We do not return refresh token in JSON.
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // POST /auth/login
  // Same login API for both admin and normal user.
  @Post('login')

  // By default POST returns 201 Created.
  // Login should return 200 OK, so we set it manually.
  @HttpCode(HttpStatus.OK)
  async login(
    // Read and validate login request body.
    @Body() body: LoginDto,

    // Response object is needed to set refresh token cookie.
    @Res({ passthrough: true }) response: Response,
  ) {
    // Call AuthService login method.
    const result = await this.authService.login(body);

    // Store refresh token in HTTP-only cookie.
    this.setRefreshTokenCookie(response, result.refreshToken);

    // Return access token and user info.
    // Frontend will use user.role to redirect user/admin dashboard.
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // POST /auth/refresh
  // This API creates a new access token using refresh token cookie.
  @Post('refresh')

  // Return 200 OK.
  @HttpCode(HttpStatus.OK)
  async refresh(
    // Request object is needed to read cookies.
    @Req() request: RequestWithCookies,

    // Response object is needed to set new refresh token cookie.
    @Res({ passthrough: true }) response: Response,
  ) {
    // Read refresh token from cookie.
    const refreshToken = request.cookies?.refresh_token;

    // If refresh token cookie is missing, block request.
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    // Ask AuthService to verify refresh token and create new tokens.
    const result = await this.authService.refresh(refreshToken);

    // Rotate refresh token by setting a new cookie.
    this.setRefreshTokenCookie(response, result.refreshToken);

    // Return new access token and user data.
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // POST /auth/logout
  // This API logs out current user.
  @Post('logout')

  // Return 200 OK.
  @HttpCode(HttpStatus.OK)

  // User must have valid access token to logout.
  @UseGuards(JwtAuthGuard)
  async logout(
    // Get logged-in user from JWT.
    @CurrentUser() user: { id: string },

    // Response object is needed to clear cookie.
    @Res({ passthrough: true }) response: Response,
  ) {
    // Clear refresh token cookie from browser.
    response.clearCookie('refresh_token', {
      path: '/',
      sameSite: 'lax',
      secure: false,
    });

    // Remove refresh token hash from database.
    return this.authService.logout(user.id);
  }

  // GET /auth/me
  // This API returns current logged-in user from access token.
  @Get('me')

  // Protect this API with JWT.
  @UseGuards(JwtAuthGuard)
  me(
    // CurrentUser reads request.user.
    // request.user is created by JwtStrategy validate() method.
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    // Return current user data.
    return user;
  }

  // This private helper function sets refresh token cookie.
  // Private means it is only used inside this controller.
  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    // Create cookie named refresh_token.
    response.cookie('refresh_token', refreshToken, {
      // httpOnly means JavaScript cannot read this cookie.
      // This protects refresh token from XSS attacks.
      httpOnly: true,

      // secure false is okay for localhost HTTP development.
      // In production with HTTPS, we will set this to true.
      secure: false,

      // sameSite lax helps protect against CSRF.
      sameSite: 'lax',

      // path '/' means cookie is available for all backend routes.
      path: '/',

      // Cookie expiry is 7 days.
      // Value is in milliseconds.
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}