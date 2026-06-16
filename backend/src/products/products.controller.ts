// Body reads request body.
// Controller creates route group.
// Delete creates DELETE API.
// Get creates GET API.
// Param reads URL params like :id.
// Patch creates PATCH API.
// Post creates POST API.
// Query reads query params.
// UseGuards protects routes.
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

// Role enum contains "user" and "admin".
import { Role } from '../common/enums/role.enum';

// CurrentUser gives logged-in user from JWT.
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Roles decorator defines allowed roles.
import { Roles } from '../auth/decorators/roles.decorator';

// JWT guard checks valid access token.
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// RolesGuard checks user role permission.
import { RolesGuard } from '../auth/guards/roles.guard';

// CreateProductDto validates create product body.
import { CreateProductDto } from './dto/create-product.dto';

// ProductQueryDto validates search/pagination query.
import { ProductQueryDto } from './dto/product-query.dto';

// UpdateInventoryDto validates inventory update body.
import { UpdateInventoryDto } from './dto/update-inventory.dto';

// UpdateProductDto validates update product body.
import { UpdateProductDto } from './dto/update-product.dto';

// ProductsService contains product business logic.
import { ProductsService } from './products.service';

// This type represents logged-in user from JWT.
type AuthUser = {
  // Logged-in user id.
  id: string;

  // Logged-in user email.
  email: string;

  // Logged-in user role.
  role: Role;
};

// @Controller('products') means all routes start with /products.
@Controller('products')
export class ProductsController {
  // Inject ProductsService into this controller.
  constructor(private readonly productsService: ProductsService) {}

  // GET /products
  // Public API for homepage product listing.
  // Example: /products?page=1&limit=10&search=phone
  @Get()
  findPublic(@Query() query: ProductQueryDto) {
    // Call service to get public active products.
    return this.productsService.findPublic(query);
  }

  // GET /products/my
  // Logged-in user dashboard product listing.
  @Get('my')

  // User must be logged in.
  @UseGuards(JwtAuthGuard)
  findMyProducts(
    // Read query params.
    @Query() query: ProductQueryDto,

    // Read logged-in user from JWT.
    @CurrentUser() user: AuthUser,
  ) {
    // Return only products created by this user.
    return this.productsService.findMyProducts(query, user);
  }

  // GET /products/admin/all
  // Admin can see all products.
  @Get('admin/all')

  // First check JWT, then role.
  @UseGuards(JwtAuthGuard, RolesGuard)

  // Only admin can access this route.
  @Roles(Role.Admin)
  findAllForAdmin(@Query() query: ProductQueryDto) {
    // Return all products for admin.
    return this.productsService.findAllForAdmin(query);
  }

  // GET /products/:id
  // Public product detail page.
  @Get(':id')
  findOnePublic(
    // Read product id from URL.
    @Param('id') id: string,
  ) {
    // Return one active product.
    return this.productsService.findOnePublic(id);
  }

  // POST /products
  // Logged-in user/admin can create product.
  @Post()

  // Protect route with JWT.
  @UseGuards(JwtAuthGuard)
  create(
    // Validate request body.
    @Body() body: CreateProductDto,

    // Get logged-in user.
    @CurrentUser() user: AuthUser,
  ) {
    // Create product with current user as owner.
    return this.productsService.create(body, user);
  }

  // PATCH /products/:id
  // Owner or admin can update product.
  @Patch(':id')

  // Protect route with JWT.
  @UseGuards(JwtAuthGuard)
  update(
    // Read product id from URL.
    @Param('id') id: string,

    // Validate update body.
    @Body() body: UpdateProductDto,

    // Get logged-in user.
    @CurrentUser() user: AuthUser,
  ) {
    // Update product if user is owner/admin.
    return this.productsService.update(id, body, user);
  }

  // PATCH /products/:id/inventory
  // Owner or admin can update inventory.
  @Patch(':id/inventory')

  // Protect route with JWT.
  @UseGuards(JwtAuthGuard)
  updateInventory(
    // Read product id from URL.
    @Param('id') id: string,

    // Validate inventory body.
    @Body() body: UpdateInventoryDto,

    // Get logged-in user.
    @CurrentUser() user: AuthUser,
  ) {
    // Update stock and low stock alert.
    return this.productsService.updateInventory(id, body, user);
  }

  // DELETE /products/:id
  // Owner or admin can delete product.
  @Delete(':id')

  // Protect route with JWT.
  @UseGuards(JwtAuthGuard)
  remove(
    // Read product id from URL.
    @Param('id') id: string,

    // Get logged-in user.
    @CurrentUser() user: AuthUser,
  ) {
    // Delete product if user is owner/admin.
    return this.productsService.remove(id, user);
  }
}