// Module decorator creates a Nest.js module.
import { Module } from '@nestjs/common';

// TypeOrmModule gives repository access for entities.
import { TypeOrmModule } from '@nestjs/typeorm';

// ProductImage entity creates/uses product_images table.
import { ProductImage } from './product-image.entity';

// Product entity creates/uses products table.
import { Product } from './product.entity';

// ProductsController creates product API routes.
import { ProductsController } from './products.controller';

// ProductsService contains product business logic.
import { ProductsService } from './products.service';

// ProductsModule groups product-related files.
@Module({
  // forFeature creates repositories for Product and ProductImage.
  imports: [TypeOrmModule.forFeature([Product, ProductImage])],

  // controllers register API routes.
  controllers: [ProductsController],

  // providers register services.
  providers: [ProductsService],
})
export class ProductsModule {}