// Type converts query string values to numbers.
import { Type } from 'class-transformer';

// Validators for query params.
import {
  IsInt, // Field must be integer.
  IsOptional, // Field is optional.
  IsString, // Field must be string.
  Max, // Maximum number.
  Min, // Minimum number.
} from 'class-validator';

// This DTO is used for product listing APIs.
// It handles search and pagination.
export class ProductQueryDto {
  // page is optional.
  @IsOptional()

  // Convert page query string to number.
  @Type(() => Number)

  // page must be integer.
  @IsInt()

  // page minimum is 1.
  @Min(1)

  // Current page number.
  page?: number;

  // limit is optional.
  @IsOptional()

  // Convert limit query string to number.
  @Type(() => Number)

  // limit must be integer.
  @IsInt()

  // limit minimum is 1.
  @Min(1)

  // limit maximum is 100 to avoid heavy queries.
  @Max(100)

  // Number of products per page.
  limit?: number;

  // search is optional.
  @IsOptional()

  // search must be string.
  @IsString()

  // Search keyword.
  search?: string;
}