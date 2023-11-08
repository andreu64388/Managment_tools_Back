import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}
  async create(createRoleDto: CreateRoleDto) {
    const isUsedRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });
    if (isUsedRole) {
      return isUsedRole;
    }
    const newRole = await this.roleRepository.create(createRoleDto);
    await this.roleRepository.save(newRole);
    return newRole;
  }

  async findAll() {
    return await this.roleRepository.find();
  }

  async remove(id: number) {
    return await this.roleRepository.delete(id);
  }
}
