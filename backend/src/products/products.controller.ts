// BadRequestException is used when uploaded file type is invalid.
// Body reads request body.
// Controller creates route group.
// Delete creates DELETE API.
// Get creates GET API.
// Param reads URL params like :id.
// Patch creates PATCH API.
// Post creates POST API.
// Query reads query params.
// UploadedFiles reads files uploaded by multer.
// UseGuards protects routes.
// UseInterceptors enables file upload interceptor.
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

// FilesInterceptor handles multiple file upload.
import { FilesInterceptor } from '@nestjs/platform-express';

// randomUUID creates unique filenames.
import { randomUUID } from 'crypto';

// mkdirSync creates upload folder if missing.
import { mkdirSync } from 'fs';

// diskStorage stores uploaded files on disk.
import { diskStorage } from 'multer';

// extname gets file extension.
// join creates safe file/folder path.
import { extname, join } from 'path';

// CurrentUser gives logged-in user from JWT.
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Roles decorator defines allowed roles.
import { Roles } from '../auth/decorators/roles.decorator';

// JWT guard checks valid access token.
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// RolesGuard checks user role permission.
import { RolesGuard } from '../auth/guards/roles.guard';

// Role enum contains "user" and "admin".
import { Role } from '../common/enums/role.enum';

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

// Product image upload folder.
// process.cwd() is /app inside Docker backend container.
const PRODUCT_UPLOAD_DIR = join(process.cwd(), 'uploads', 'products');

// Allowed image MIME types.
// This blocks uploading PDF, JS, EXE, etc.
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Maximum images user can upload in one request.
const MAX_IMAGES_PER_REQUEST = 5;

// Maximum size for each image.
// Here 2 MB per image.
const MAX_IMAGE_SIZE_IN_BYTES = 2 * 1024 * 1024;

// Multer storage configuration.
// This decides where uploaded files are saved and what filename is used.
const productImageStorage = diskStorage({
  // destination decides upload folder.
  destination: (_request, _file, callback) => {
    // Create upload folder if it does not exist.
    mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });

    // Tell multer to save files in products upload folder.
    callback(null, PRODUCT_UPLOAD_DIR);
  },

  // filename decides saved filename.
  filename: (_request, file, callback) => {
    // Get original file extension.
    // Example: .jpg, .png, .webp
    const extension = extname(file.originalname).toLowerCase();

    // Create unique filename.
    // Example: uuid.jpg
    const filename = `${randomUUID()}${extension}`;

    // Tell multer to use this filename.
    callback(null, filename);
  },
});

// File filter checks uploaded file type before saving.
const productImageFileFilter = (
  _request: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  // Check MIME type.
  const isAllowed = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype);

  // If file is not allowed image type, reject it.
  if (!isAllowed) {
    return callback(
      new BadRequestException('Only JPG, PNG, and WEBP images are allowed'),
      false,
    );
  }

  // Accept valid image file.
  return callback(null, true);
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

  // POST /products/:id/images
  // Upload multiple images for one product.
  @Post(':id/images')

  // User must be logged in.
  @UseGuards(JwtAuthGuard)

  // FilesInterceptor handles multiple files from form-data key "images".
  @UseInterceptors(
    FilesInterceptor('images', MAX_IMAGES_PER_REQUEST, {
      // Save files on disk.
      storage: productImageStorage,

      // Validate file type.
      fileFilter: productImageFileFilter,

      // Validate file size.
      limits: {
        fileSize: MAX_IMAGE_SIZE_IN_BYTES,
      },
    }),
  )
  addImages(
    // Product id from URL.
    @Param('id') id: string,

    // Uploaded files from form-data field named "images".
    @UploadedFiles() files: Express.Multer.File[],

    // Logged-in user.
    @CurrentUser() user: AuthUser,
  ) {
    // Add images to product.
    return this.productsService.addImages(id, files, user);
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

  // PATCH /products/:id/images/:imageId/primary
  // Owner or admin can set product primary image.
  @Patch(':id/images/:imageId/primary')

  // Protect route with JWT.
  @UseGuards(JwtAuthGuard)
  setPrimaryImage(
    // Product id from URL.
    @Param('id') id: string,

    // Image id from URL.
    @Param('imageId') imageId: string,

    // Logged-in user.
    @CurrentUser() user: AuthUser,
  ) {
    // Set selected image as primary.
    return this.productsService.setPrimaryImage(id, imageId, user);
  }

  // DELETE /products/:id/images/:imageId
  // Owner or admin can delete product image.
  @Delete(':id/images/:imageId')

  // Protect route with JWT.
  @UseGuards(JwtAuthGuard)
  removeImage(
    // Product id from URL.
    @Param('id') id: string,

    // Image id from URL.
    @Param('imageId') imageId: string,

    // Logged-in user.
    @CurrentUser() user: AuthUser,
  ) {
    // Delete image.
    return this.productsService.removeImage(id, imageId, user);
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