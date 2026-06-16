// These decorators come from TypeORM.
// They help us define database table, columns, and relationships.
import {
  Column, // Creates a normal database column.
  CreateDateColumn, // Automatically stores row creation date/time.
  Entity, // Marks this class as a database table.
  JoinColumn, // Defines the foreign key column name.
  ManyToOne, // Defines many images belong to one product.
  PrimaryGeneratedColumn, // Creates primary key column.
} from 'typeorm';

// Import Product entity.
// Each product image belongs to one product.
import { Product } from './product.entity';

// @Entity('product_images') means PostgreSQL table name will be product_images.
@Entity('product_images')
export class ProductImage {
  // Creates UUID primary key for each image row.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Stores image URL/path.
  // Example: /uploads/products/product-image.jpg
  @Column({
    type: 'text',
  })
  url!: string;

  // Stores image filename.
  // Example: product-image.jpg
  @Column({
    type: 'text',
  })
  filename!: string;

  // Tells which image is the main/thumbnail image.
  // One product can have many images, but one can be primary.
  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary!: boolean;

  // Many product images belong to one product.
  // If product is deleted, related image records will also be deleted.
  @ManyToOne(() => Product, (product: Product) => product.images, {
    onDelete: 'CASCADE',
  })

  // This sets the foreign key column name as product_id.
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  // This column stores product id directly.
  // It is useful when querying/filtering images by product.
  @Column({
    name: 'product_id',
    type: 'uuid',
  })
  productId!: string;

  // Automatically stores when image row was created.
  @CreateDateColumn()
  createdAt!: Date;
}