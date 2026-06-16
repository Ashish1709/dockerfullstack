// Module decorator creates the main/root Nest.js module.
import { Module } from '@nestjs/common';

// ConfigModule reads variables from backend/.env file.
import { ConfigModule } from '@nestjs/config';

// TypeOrmModule connects Nest.js with PostgreSQL database.
import { TypeOrmModule } from '@nestjs/typeorm';

// Default AppController created by Nest.js.
import { AppController } from './app.controller';

// Default AppService created by Nest.js.
import { AppService } from './app.service';

// AuthModule contains register, login, refresh, logout, and JWT logic.
import { AuthModule } from './auth/auth.module';

// UsersModule contains user entity and user database service.
import { UsersModule } from './users/users.module';

// ProductsModule contains product CRUD, inventory, and images.
import { ProductsModule } from './products/products.module';

// AppModule is the root module of backend.
@Module({
  // imports register other modules inside the app.
  imports: [
    // Loads backend/.env variables into process.env.
    ConfigModule.forRoot({
      // isGlobal true means ConfigService can be used in any module.
      isGlobal: true,
    }),

    // Connect backend with PostgreSQL.
    TypeOrmModule.forRoot({
      // Database type is PostgreSQL.
      type: 'postgres',

      // PostgreSQL host from backend/.env.
      // In Docker this should be "postgres".
      host: process.env.DB_HOST,

      // PostgreSQL port from backend/.env.
      // Number() converts string value to number.
      port: Number(process.env.DB_PORT),

      // PostgreSQL username from backend/.env.
      username: process.env.DB_USERNAME,

      // PostgreSQL password from backend/.env.
      password: process.env.DB_PASSWORD,

      // PostgreSQL database name from backend/.env.
      database: process.env.DB_NAME,

      // Automatically loads entities from modules.
      autoLoadEntities: true,

      // Development only.
      // This automatically creates/updates tables.
      // Later for production we will change this to false and use migrations.
      synchronize: true,
    }),

    // Register UsersModule.
    UsersModule,

    // Register AuthModule.
    // Without this, /auth/register gives 404.
    AuthModule,

    // Register ProductsModule.
    ProductsModule,
  ],

  // controllers register app-level controllers.
  controllers: [AppController],

  // providers register app-level services.
  providers: [AppService],
})
export class AppModule {}