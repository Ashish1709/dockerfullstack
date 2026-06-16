// These validators come from class-validator package.
// They help us check incoming request body data before it reaches our service.
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// This file is used for POST /auth/register.
// DTO means Data Transfer Object.
// It defines what data frontend must send during registration.
export class RegisterDto {
  // @IsString() means name must be text.
  @IsString()

  // @IsNotEmpty() means name cannot be empty.
  @IsNotEmpty()

  // User's full name.
  name!: string;

  // @IsEmail() means email must be valid email format.
  // Example valid email: user@example.com
  @IsEmail()

  // User's email address.
  email!: string;

  // @IsString() means password must be text.
  @IsString()

  // @MinLength(8) means password must have at least 8 characters.
  // This is basic password security.
  @MinLength(8)

  // User's plain password from frontend.
  // We will never save this plain password.
  // AuthService will hash it before saving.
  password!: string;
}