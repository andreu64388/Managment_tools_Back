import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesGuard } from 'src/guards/roles-guard';
import { Roles } from 'src/decorator/roles.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({ summary: 'Get all currencies' })
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }
}
