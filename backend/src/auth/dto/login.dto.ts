// These validators come from class-validator package.
// They validate login request body.
import { IsEmail, IsString, MinLength } from 'class-validator';

// This file is used for POST /auth/login.
// It defines what data frontend must send during login.
export class LoginDto {
  // @IsEmail() checks that email is valid email format.
  @IsEmail()

  // User's login email.
  email!: string;

  // @IsString() checks that password is text.
  @IsString()

  // Password must be at least 8 characters.
  // Same rule as registration.
  @MinLength(8)

  // User's login password.
  password!: string;
}