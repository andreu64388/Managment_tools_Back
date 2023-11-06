import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const newUser = await this.userRepository.create(createUserDto);
    await this.userRepository.save(newUser);
    return newUser;
  }

  async createUserService(email: string) {
    const newUser = await this.userRepository.create({ email });
    await this.userRepository.save(newUser);
    return newUser;
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async updatePassword(id: number, newPassword: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`Пользователь с id ${id} не найден.`);
    }
    user.password = newPassword;

    await this.userRepository.save(user);

    return user;
  }
  async findById(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }
}