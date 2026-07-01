// BadRequestException is used when uploaded images are invalid.
// ForbiddenException is used when user cannot manage product.
// Injectable makes this class a Nest.js service.
// NotFoundException is used when product/image does not exist.
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// unlink deletes image file from disk.
import { unlink } from 'fs/promises';

// join safely creates file path.
import { join } from 'path';

// InjectRepository allows us to inject TypeORM repositories.
import { InjectRepository } from '@nestjs/typeorm';

// Repository gives database methods like create, save, findOne, delete, etc.
import { Repository } from 'typeorm';

// Role enum contains "user" and "admin".
import { Role } from '../common/enums/role.enum';

// CreateProductDto validates product create data.
import { CreateProductDto } from './dto/create-product.dto';

// ProductQueryDto validates search and pagination query params.
import { ProductQueryDto } from './dto/product-query.dto';

// UpdateInventoryDto validates inventory update data.
import { UpdateInventoryDto } from './dto/update-inventory.dto';

// UpdateProductDto validates product update data.
import { UpdateProductDto } from './dto/update-product.dto';

// ProductImage entity is for product_images table.
import { ProductImage } from './product-image.entity';

// Product entity is for products table.
import { Product } from './product.entity';

// This type represents logged-in user data from JWT.
type AuthUser = {
  // Logged-in user id.
  id: string;

  // Logged-in user email.
  email: string;

  // Logged-in user role.
  role: Role;
};

// @Injectable means Nest.js can inject this service into controller.
@Injectable()
export class ProductsService {
  // Constructor injects Product and ProductImage repositories.
  constructor(
    // This repository talks to products table.
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    // This repository talks to product_images table.
    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,
  ) {}

  // create() creates a new product.
  // Any logged-in user can create a product.
  // Admin can also create a product.
  create(data: CreateProductDto, user: AuthUser) {
    // Create Product entity object.
    const product = this.productsRepository.create({
      // Product name from request body.
      name: data.name,

      // Optional description.
      // If not provided, save null.
      description: data.description ?? null,

      // PostgreSQL numeric values usually come back as string.
      // So we save price as string in entity.
      price: data.price.toString(),

      // Product stock quantity.
      stock: data.stock,

      // Low stock alert value.
      // If not provided, default 0.
      lowStockAlert: data.lowStockAlert ?? 0,

      // Optional SKU/product code.
      // If not provided, save null.
      sku: data.sku ?? null,

      // Product is active by default.
      isActive: true,

      // Store logged-in user id as product creator.
      createdById: user.id,
    });

    // Save product into PostgreSQL database.
    return this.productsRepository.save(product);
  }

  // findPublic() returns active products for homepage.
  // It supports search and pagination.
  async findPublic(query: ProductQueryDto) {
    // If page not provided, use page 1.
    const page = query.page ?? 1;

    // If limit not provided, show 10 products.
    const limit = query.limit ?? 10;

    // Calculate how many products to skip.
    // Page 1 skips 0, page 2 skips 10, etc.
    const skip = (page - 1) * limit;

    // Start building database query.
    const qb = this.productsRepository
      .createQueryBuilder('product')

      // Include product images in response.
      .leftJoinAndSelect('product.images', 'images')

      // Public page should show only active products.
      .where('product.isActive = :isActive', { isActive: true });

    // If search query exists, search in name, description, and SKU.
    if (query.search) {
      // Add search condition.
      qb.andWhere(
        `(
          LOWER(product.name) LIKE LOWER(:search)
          OR LOWER(product.description) LIKE LOWER(:search)
          OR LOWER(product.sku) LIKE LOWER(:search)
        )`,
        {
          // Add % before/after to search partial words.
          search: `%${query.search}%`,
        },
      );
    }

    // Get products and total count.
    const [data, total] = await qb
      // Latest products first.
      .orderBy('product.createdAt', 'DESC')

      // Skip records for pagination.
      .skip(skip)

      // Limit records per page.
      .take(limit)

      // Execute query.
      .getManyAndCount();

    // Return data with pagination info.
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  // findMyProducts() returns products created by logged-in user.
  // This is for user dashboard.
  async findMyProducts(query: ProductQueryDto, user: AuthUser) {
    // If page not provided, use page 1.
    const page = query.page ?? 1;

    // If limit not provided, use 10.
    const limit = query.limit ?? 10;

    // Calculate skip count.
    const skip = (page - 1) * limit;

    // Start query.
    const qb = this.productsRepository
      .createQueryBuilder('product')

      // Include product images.
      .leftJoinAndSelect('product.images', 'images')

      // Only show products created by logged-in user.
      .where('product.createdById = :userId', { userId: user.id });

    // Add search if provided.
    if (query.search) {
      qb.andWhere(
        `(
          LOWER(product.name) LIKE LOWER(:search)
          OR LOWER(product.description) LIKE LOWER(:search)
          OR LOWER(product.sku) LIKE LOWER(:search)
        )`,
        {
          search: `%${query.search}%`,
        },
      );
    }

    // Run query with pagination.
    const [data, total] = await qb
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Return response.
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  // findAllForAdmin() returns all products.
  // Only admin will use this later.
  async findAllForAdmin(query: ProductQueryDto) {
    // Default page.
    const page = query.page ?? 1;

    // Default limit.
    const limit = query.limit ?? 10;

    // Calculate skip.
    const skip = (page - 1) * limit;

    // Start query.
    const qb = this.productsRepository
      .createQueryBuilder('product')

      // Include images.
      .leftJoinAndSelect('product.images', 'images')

      // Include creator user.
      .leftJoinAndSelect('product.createdBy', 'createdBy');

    // Add search if exists.
    if (query.search) {
      qb.where(
        `(
          LOWER(product.name) LIKE LOWER(:search)
          OR LOWER(product.description) LIKE LOWER(:search)
          OR LOWER(product.sku) LIKE LOWER(:search)
        )`,
        {
          search: `%${query.search}%`,
        },
      );
    }

    // Execute query.
    const [data, total] = await qb
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Return response.
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  // findOnePublic() returns single active product.
  // This can be used on public product detail page.
  async findOnePublic(id: string) {
    // Find active product by id with images.
    const product = await this.productsRepository.findOne({
      where: {
        id,
        isActive: true,
      },
      relations: {
        images: true,
      },
    });

    // If product not found, throw 404.
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Return product.
    return product;
  }

  // findOneForOwnerOrAdmin() returns product only if user owns it or user is admin.
  // This is used before update/delete/inventory operations.
  async findOneForOwnerOrAdmin(id: string, user: AuthUser) {
    // Find product by id.
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: {
        images: true,
      },
    });

    // If product not found, throw 404.
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check permission.
    this.checkOwnerOrAdmin(product, user);

    // Return product.
    return product;
  }

  // update() updates product basic data.
  async update(id: string, data: UpdateProductDto, user: AuthUser) {
    // Find product and check permission.
    const product = await this.findOneForOwnerOrAdmin(id, user);

    // If name provided, update name.
    if (data.name !== undefined) {
      product.name = data.name;
    }

    // If description provided, update description.
    if (data.description !== undefined) {
      product.description = data.description;
    }

    // If price provided, update price.
    if (data.price !== undefined) {
      product.price = data.price.toString();
    }

    // If stock provided, update stock.
    if (data.stock !== undefined) {
      product.stock = data.stock;
    }

    // If lowStockAlert provided, update it.
    if (data.lowStockAlert !== undefined) {
      product.lowStockAlert = data.lowStockAlert;
    }

    // If SKU provided, update SKU.
    if (data.sku !== undefined) {
      product.sku = data.sku;
    }

    // If isActive provided, update active status.
    if (data.isActive !== undefined) {
      product.isActive = data.isActive;
    }

    // Save updated product.
    return this.productsRepository.save(product);
  }

  // updateInventory() updates stock and low stock alert only.
  async updateInventory(id: string, data: UpdateInventoryDto, user: AuthUser) {
    // Find product and check permission.
    const product = await this.findOneForOwnerOrAdmin(id, user);

    // Update stock quantity.
    product.stock = data.stock;

    // If lowStockAlert is provided, update it.
    if (data.lowStockAlert !== undefined) {
      product.lowStockAlert = data.lowStockAlert;
    }

    // Save updated product.
    return this.productsRepository.save(product);
  }

  // remove() deletes a product.
  // It also deletes related uploaded image files from disk.
  async remove(id: string, user: AuthUser) {
    // Find product and check permission.
    // This method already loads product images because relations.images is true.
    const product = await this.findOneForOwnerOrAdmin(id, user);

    // Collect image filenames before deleting product from database.
    // We need filenames so we can delete physical files from uploads/products.
    const imageFilenames = (product.images ?? []).map(
      (image) => image.filename,
    );

    // Delete product from database.
    // Because ProductImage has onDelete: 'CASCADE',
    // related product_images rows will also be deleted from database.
    await this.productsRepository.remove(product);

    // Delete physical image files from backend/uploads/products folder.
    // Promise.all runs all delete operations together.
    await Promise.all(
      imageFilenames.map((filename) => this.removeStoredImageFile(filename)),
    );

    // Return success message.
    return {
      message: 'Product deleted successfully',
    };
  }

    // addImages() adds one or multiple images to a product.
  // User must be product owner or admin.
  async addImages(
    // Product id from URL.
    id: string,

    // Uploaded files from multer.
    files: Express.Multer.File[] | undefined,

    // Logged-in user from JWT.
    user: AuthUser,
  ) {
    // If no files uploaded, return bad request.
    if (!files || files.length === 0) {
      throw new BadRequestException('Please upload at least one image');
    }

    // Find product and check owner/admin permission.
    const product = await this.findOneForOwnerOrAdmin(id, user);

    // Existing product images.
    const existingImages = product.images ?? [];

    // Limit total images per product.
    // This protects storage and keeps product UI clean.
    const maxImagesPerProduct = 10;

    // If upload will exceed max image limit, delete uploaded files and throw error.
    if (existingImages.length + files.length > maxImagesPerProduct) {
      await this.removeUploadedFiles(files);

      throw new BadRequestException(
        `A product can have maximum ${maxImagesPerProduct} images`,
      );
    }

    // Check if product already has a primary image.
    const hasPrimaryImage = existingImages.some((image) => image.isPrimary);

    // Create ProductImage entity objects from uploaded files.
    const imageEntities = files.map((file, index) =>
      this.productImagesRepository.create({
        // Public URL used by frontend to show image.
        url: `/uploads/products/${file.filename}`,

        // Stored filename on disk.
        filename: file.filename,

        // Connect image to product.
        productId: product.id,

        // If product has no primary image yet,
        // make first uploaded image primary.
        isPrimary: !hasPrimaryImage && index === 0,
      }),
    );

    // Save image records into product_images table.
    await this.productImagesRepository.save(imageEntities);

    // Return updated product with images.
    return this.findOneForOwnerOrAdmin(id, user);
  }

  // setPrimaryImage() marks one image as product thumbnail/main image.
  // User must be product owner or admin.
  async setPrimaryImage(productId: string, imageId: string, user: AuthUser) {
    // Find product and check permission.
    await this.findOneForOwnerOrAdmin(productId, user);

    // Find image by image id and product id.
    const image = await this.productImagesRepository.findOne({
      where: {
        id: imageId,
        productId,
      },
    });

    // If image does not exist for this product, throw 404.
    if (!image) {
      throw new NotFoundException('Product image not found');
    }

    // First set all images of this product to non-primary.
    await this.productImagesRepository.update(
      { productId },
      { isPrimary: false },
    );

    // Then make selected image primary.
    image.isPrimary = true;

    // Save selected image.
    await this.productImagesRepository.save(image);

    // Return updated product with images.
    return this.findOneForOwnerOrAdmin(productId, user);
  }

  // removeImage() deletes image record and physical image file.
  // User must be product owner or admin.
  async removeImage(productId: string, imageId: string, user: AuthUser) {
    // Find product and check owner/admin permission.
    await this.findOneForOwnerOrAdmin(productId, user);

    // Find image by id and product id.
    const image = await this.productImagesRepository.findOne({
      where: {
        id: imageId,
        productId,
      },
    });

    // If image does not exist, throw 404.
    if (!image) {
      throw new NotFoundException('Product image not found');
    }

    // Store whether deleted image was primary.
    const wasPrimary = image.isPrimary;

    // Remove image row from database.
    await this.productImagesRepository.remove(image);

    // Remove physical file from uploads/products folder.
    await this.removeStoredImageFile(image.filename);

    // If deleted image was primary, make another image primary.
    if (wasPrimary) {
      // Find next available image for this product.
      const nextImage = await this.productImagesRepository.findOne({
        where: { productId },
        order: { createdAt: 'ASC' },
      });

      // If another image exists, make it primary.
      if (nextImage) {
        nextImage.isPrimary = true;
        await this.productImagesRepository.save(nextImage);
      }
    }

    // Return success message.
    return {
      message: 'Product image deleted successfully',
    };
  }

  // removeUploadedFiles() deletes files that were uploaded but cannot be used.
  // Example: user uploads too many images, so we clean up disk files.
  private async removeUploadedFiles(files: Express.Multer.File[]) {
    // Loop all uploaded files.
    await Promise.all(
      files.map((file) =>
        // Delete file by multer file path.
        unlink(file.path).catch(() => undefined),
      ),
    );
  }

  // removeStoredImageFile() deletes an already saved product image file.
  private async removeStoredImageFile(filename: string) {
    // Build full file path.
    // process.cwd() is /app inside backend container.
    const filePath = join(process.cwd(), 'uploads', 'products', filename);

    // Delete file.
    // catch(() => undefined) prevents error if file already missing.
    await unlink(filePath).catch(() => undefined);
  }

  // checkOwnerOrAdmin() verifies permission.
  private checkOwnerOrAdmin(product: Product, user: AuthUser) {
    // Admin can manage any product.
    if (user.role === Role.Admin) {
      return;
    }

    // Product owner can manage own product.
    if (product.createdById === user.id) {
      return;
    }

    // Otherwise block request.
    throw new ForbiddenException('You are not allowed to manage this product');
  }
}