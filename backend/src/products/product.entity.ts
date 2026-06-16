// These decorators come from TypeORM.
// They tell TypeORM how to create columns and relations in PostgreSQL.
import {
  Column, // Creates a normal database column.
  CreateDateColumn, // Automatically stores created date/time.
  Entity, // Marks this class as a database table.
  JoinColumn, // Defines custom foreign key column name.
  ManyToOne, // Defines many products belong to one user.
  OneToMany, // Defines one product has many images.
  PrimaryGeneratedColumn, // Creates primary key column.
  UpdateDateColumn, // Automatically stores updated date/time.
} from 'typeorm';

// Import User entity because each product is created by one user.
import { User } from '../users/user.entity';

// Import ProductImage because one product can have multiple images.
import { ProductImage } from './product-image.entity';

// @Entity('products') means PostgreSQL table name will be products.
@Entity('products')
export class Product {
  // Creates UUID primary key for product.
  // UUID is better than simple numeric id for public APIs.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Product name column.
  // Example: "iPhone 15", "T-Shirt", "Laptop"
  @Column({ length: 150 })
  name!: string;

  // Product description column.
  // type: 'text' allows long description.
  // nullable: true means description is optional.
  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  // Product price column.
  // numeric is good for money values in PostgreSQL.
  // precision: 10 means total digits allowed.
  // scale: 2 means 2 digits after decimal.
  // Example: 99999.99
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price!: string;

  // Stock quantity column.
  // This is used for inventory management.
  // Example: 10 means 10 items available.
  @Column({
    type: 'int',
    default: 0,
  })
  stock!: number;

  // Low stock alert column.
  // Example: if lowStockAlert is 5 and stock is 4,
  // frontend can show "Low stock" warning.
  @Column({
    name: 'low_stock_alert',
    type: 'int',
    default: 0,
  })
  lowStockAlert!: number;

  // SKU means Stock Keeping Unit.
  // It is optional product code.
  // Example: IPHONE-15-BLACK-128
  //
  // IMPORTANT:
  // Because TypeScript type is string | null,
  // we must explicitly tell TypeORM the database type.
  // Otherwise TypeORM may detect it as Object,
  // and PostgreSQL does not support Object column type.
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  sku!: string | null;

  // Product active/inactive status.
  // If false, we can hide it from public product listing.
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  // Many products can belong to one user.
  // createdBy stores the user object who created this product.
  @ManyToOne(() => User, {
    // If user is deleted, delete their products also.
    onDelete: 'CASCADE',
  })

  // JoinColumn sets database foreign key column name.
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  // This is the actual foreign key column in products table.
  // It stores user id of product creator.
  @Column({
    name: 'created_by_id',
    type: 'uuid',
  })
  createdById!: string;

  // One product can have many images.
 // We added ": ProductImage" so TypeScript knows image type.
 @OneToMany(() => ProductImage, (image: ProductImage) => image.product)
  images!: ProductImage[];

  // Automatically stores product creation date/time.
  @CreateDateColumn()
  createdAt!: Date;

  // Automatically stores product update date/time.
  @UpdateDateColumn()
  updatedAt!: Date;
}