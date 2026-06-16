// Type converts string values to numbers.
import { Type } from 'class-transformer';

// Validators for update product request.
import {
  IsBoolean, // Field must be boolean.
  IsNumber, // Field must be number.
  IsOptional, // Field is optional.
  IsString, // Field must be string.
  MaxLength, // Maximum string length.
  Min, // Minimum number.
} from 'class-validator';

// This DTO is used for PATCH /products/:id.
// All fields are optional because update may change only one field.
export class UpdateProductDto {
  // Name is optional during update.
  @IsOptional()

  // Name must be string if provided.
  @IsString()

  // Name maximum length.
  @MaxLength(150)

  // Product name.
  name?: string;

  // Description is optional.
  @IsOptional()

  // Description must be string if provided.
  @IsString()

  // Product description.
  description?: string;

  // Price is optional.
  @IsOptional()

  // Convert price to number.
  @Type(() => Number)

  // Price must be number if provided.
  @IsNumber()

  // Price cannot be less than 0.
  @Min(0)

  // Product price.
  price?: number;

  // Stock is optional.
  @IsOptional()

  // Convert stock to number.
  @Type(() => Number)

  // Stock must be number if provided.
  @IsNumber()

  // Stock cannot be less than 0.
  @Min(0)

  // Inventory quantity.
  stock?: number;

  // lowStockAlert is optional.
  @IsOptional()

  // Convert lowStockAlert to number.
  @Type(() => Number)

  // lowStockAlert must be number if provided.
  @IsNumber()

  // lowStockAlert cannot be less than 0.
  @Min(0)

  // Low stock warning number.
  lowStockAlert?: number;

  // SKU is optional.
  @IsOptional()

  // SKU must be string if provided.
  @IsString()

  // SKU maximum length.
  @MaxLength(100)

  // Product SKU/code.
  sku?: string;

  // isActive is optional.
  @IsOptional()

  // Convert value to boolean.
  @Type(() => Boolean)

  // Must be boolean if provided.
  @IsBoolean()

  // Product active/inactive status.
  isActive?: boolean;
}