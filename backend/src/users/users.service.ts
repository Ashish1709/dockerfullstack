// Injectable allows this class to be injected into other files like AuthService.
import { Injectable } from '@nestjs/common';

// InjectRepository allows us to use TypeORM repository inside Nest service.
import { InjectRepository } from '@nestjs/typeorm';

// Repository gives database methods like findOne, save, update, delete, etc.
import { Repository } from 'typeorm';

// Import Role enum for user role type.
import { Role } from '../common/enums/role.enum';

// Import User entity so this service can work with users table.
import { User } from './user.entity';

// @Injectable marks this class as a Nest.js provider/service.
@Injectable()
export class UsersService {
  // Constructor runs when Nest creates this service.
  constructor(
    // This injects the TypeORM repository for User entity.
    // usersRepository is now connected to the users table.
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Find user by ID.
  // Used when JWT token has user id and we need full user data.
  findById(id: string) {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  // Find user by email.
  // Used during registration to check if email already exists.
  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  // Find user by email including password.
  // Normally password has select: false, so it is hidden.
  // addSelect('user.password') manually includes password for login check.
  findByEmailWithPassword(email: string) {
    return this.usersRepository
      .createQueryBuilder('user') // Creates custom SQL query for users table.
      .addSelect('user.password') // Includes password column in result.
      .where('user.email = :email', { email }) // Searches by email safely.
      .getOne(); // Returns one user or null.
  }

  // Find user by ID including refresh token hash.
  // Used when user requests new access token using refresh token.
  findByIdWithRefreshToken(id: string) {
    return this.usersRepository
      .createQueryBuilder('user') // Creates custom query.
      .addSelect('user.refreshTokenHash') // Includes hidden refresh token hash.
      .where('user.id = :id', { id }) // Searches user by id.
      .getOne(); // Returns one user or null.
  }

  // Create a new user in database.
  createUser(data: {
    name: string; // User full name.
    email: string; // User email.
    password: string; // Hashed password.
    role?: Role; // Optional role. If not passed, default will be user.
  }) {
    // Creates a User entity object but does not save yet.
    const user = this.usersRepository.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || Role.User,
    });

    // Saves user into PostgreSQL database.
    return this.usersRepository.save(user);
  }

  // Update refresh token hash.
  // Used after login/register/refresh to save latest refresh token hash.
  // Used after logout to remove refresh token hash.
  async updateRefreshTokenHash(id: string, refreshTokenHash: string | null) {
    await this.usersRepository.update(id, {
      refreshTokenHash,
    });
  }
}