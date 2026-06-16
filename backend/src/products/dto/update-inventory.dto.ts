// Type converts incoming value to number.
import { Type } from 'class-transformer';

// Validators for inventory update.
import {
  IsNumber, // Field must be number.
  IsOptional, // Field is optional.
  Min, // Minimum value.
} from 'class-validator';

// This DTO is used for PATCH /products/:id/inventory.
// It updates stock and low stock alert.
export class UpdateInventoryDto {
  // Convert stock to number.
  @Type(() => Number)

  // stock must be number.
  @IsNumber()

  // stock cannot be less than 0.
  @Min(0)

  // Product stock quantity.
  stock!: number;

  // lowStockAlert is optional.
  @IsOptional()

  // Convert lowStockAlert to number.
  @Type(() => Number)

  // lowStockAlert must be number.
  @IsNumber()

  // lowStockAlert cannot be less than 0.
  @Min(0)

  // Warning quantity for low stock.
  lowStockAlert?: number;
}