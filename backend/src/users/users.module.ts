// Module decorator is used to create a Nest.js module.
import { Module } from '@nestjs/common';

// TypeOrmModule connects entity/repository with this module.
import { TypeOrmModule } from '@nestjs/typeorm';

// Import User entity so TypeORM can create repository for users table.
import { User } from './user.entity';

// Import UsersService so it can be used inside this module.
import { UsersService } from './users.service';

// @Module defines what this module imports, provides, and exports.
@Module({
  // forFeature([User]) makes User repository available inside this module.
  imports: [TypeOrmModule.forFeature([User])],

  // providers means services/classes created by this module.
  providers: [UsersService],

  // exports means other modules can use UsersService.
  // AuthModule will need UsersService for login/register.
  exports: [UsersService],
})
export class UsersModule {}