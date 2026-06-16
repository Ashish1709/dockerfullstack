// Type comes from class-transformer.
// It converts string values to numbers when needed.
import { Type } from 'class-transformer';

// Validators come from class-validator.
import {
  IsNotEmpty, // Field cannot be empty.
  IsNumber, // Field must be number.
  IsOptional, // Field is optional.
  IsString, // Field must be string.
  MaxLength, // Maximum string length.
  Min, // Minimum number value.
} from 'class-validator';

// This DTO is used for POST /products.
// It validates product creation data.
export class CreateProductDto {
  // Product name must be string.
  @IsString()

  // Product name cannot be empty.
  @IsNotEmpty()

  // Product name maximum length is 150.
  @MaxLength(150)

  // Product name.
  name!: string;

  // Description is optional.
  @IsOptional()

  // Description must be string if provided.
  @IsString()

  // Product description.
  description?: string;

  // Convert incoming value to number.
  // This is helpful because form-data sends values as strings.
  @Type(() => Number)

  // Price must be number.
  @IsNumber()

  // Price cannot be less than 0.
  @Min(0)

  // Product price.
  price!: number;

  // Convert stock to number.
  @Type(() => Number)

  // Stock must be number.
  @IsNumber()

  // Stock cannot be less than 0.
  @Min(0)

  // Inventory stock quantity.
  stock!: number;

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

  // SKU maximum length is 100.
  @MaxLength(100)

  // Product SKU/code.
  sku?: string;
}