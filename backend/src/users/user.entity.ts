// Import TypeORM decorators.
// These decorators convert this TypeScript class into a PostgreSQL table.
import {
  Column, // Creates a normal table column.
  CreateDateColumn, // Automatically stores when a row is created.
  Entity, // Marks this class as a database entity/table.
  PrimaryGeneratedColumn, // Creates the primary key column.
  UpdateDateColumn, // Automatically stores when a row is updated.
} from 'typeorm';

// Import our Role enum.
// This allows only "user" or "admin" as valid role values.
import { Role } from '../common/enums/role.enum';

// This file is used to create the users table in PostgreSQL.
// @Entity('users') means the database table name will be users.
@Entity('users')
export class User {
  // Creates a UUID primary key.
  // UUID is safer than auto-increment number IDs for APIs.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Creates name column in users table.
  // length: 100 means maximum 100 characters.
  @Column({ length: 100 })
  name!: string;

  // Creates email column in users table.
  // unique: true means duplicate emails are not allowed.
  // length: 180 is enough for normal email addresses.
  @Column({ unique: true, length: 180 })
  email!: string;

  // Creates password column in users table.
  // select: false means password is hidden in normal database queries.
  // We will save only hashed password here, never plain password.
  @Column({ select: false })
  password!: string;

  // Creates role column in users table.
  // type: 'enum' tells PostgreSQL this column uses fixed allowed values.
  // enum: Role means allowed values come from our Role enum.
  // default: Role.User means new users become normal users by default.
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  role!: Role;

  // Creates refresh_token_hash column in users table.
  // IMPORTANT FIX:
  // type: 'text' is required because TypeScript type is string | null.
  // Without type: 'text', TypeORM thinks this column type is Object.
  // PostgreSQL does not support Object as a column type.
  // nullable: true means it can be empty after logout.
  // select: false means it is hidden in normal database queries.
  @Column({
    type: 'text',
    name: 'refresh_token_hash',
    nullable: true,
    select: false,
  })
  refreshTokenHash!: string | null;

  // Automatically stores user creation date/time.
  // TypeORM fills this automatically.
  @CreateDateColumn()
  createdAt!: Date;

  // Automatically stores user last update date/time.
  // TypeORM updates this automatically when user row changes.
  @UpdateDateColumn()
  updatedAt!: Date;
}