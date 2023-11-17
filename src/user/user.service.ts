import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from 'src/role/role.enum';
import { RoleService } from 'src/role/role.service';
import { ApiError } from 'src/exceptions/ApiError.exception';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roleService: RoleService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const isUsedUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (isUsedUser) {
        throw new ApiError('The user with this email already exists', 400);
      }
      const userRole = await this.roleService.GetRoleByName(UserRole.USER);

      const newUser = await this.userRepository.create({
        ...createUserDto,
        roles: [userRole],
      });

      await this.userRepository.save(newUser);
      return this.findById(newUser.id);
    } catch (e) {
      throw new ApiError('Failed to create user', 500);
    }
  }

  async createAdminIfNotExists(email, password) {
    try {
      const userRole = await this.roleService.GetRoleByName(UserRole.ADMIN);

      const newUser = await this.userRepository.create({
        email,
        password,
        roles: [userRole],
      });

      await this.userRepository.save(newUser);
    } catch (e) {
      throw new ApiError('Failed to create admin user', 500);
    }
  }

  async createService(email: string, kindAuth: string) {
    try {
      const userRole = await this.roleService.GetRoleByName(UserRole.USER);
      const createUserDto = {
        email,
        kindAuth,
      };
      const newUser = await this.userRepository.create({
        ...createUserDto,
        roles: [userRole],
      });

      await this.userRepository.save(newUser);
      return this.findById(newUser.id);
    } catch (e) {
      throw new ApiError('Failed to create user', 500);
    }
  }

  async updatePassword(id: number, newPassword: string) {
    try {
      const user = await this.findById(id);

      if (!user) {
        throw new ApiError('User not found', 404);
      }
      user.password = newPassword;
      await this.userRepository.save(user);
      return user;
    } catch (e) {
      throw new ApiError('Failed to update password', 500);
    }
  }
  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
    return user;
  }
}
