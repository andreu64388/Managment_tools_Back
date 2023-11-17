import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { User } from 'src/user/entities/user.entity';
import { UserRole } from 'src/role/role.enum';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  async create(name: string): Promise<Template> {
    const template = this.templateRepository.create({ name });
    return this.templateRepository.save(template);
  }

  async update(updateTemplateTemplate: UpdateTemplateDto): Promise<Template> {
    try {
      const template = await this.templateRepository.findOne({
        where: {
          id: updateTemplateTemplate.templateId,
        },
      });
      if (!template) {
        throw new ApiError('Template not found', 404);
      }
      template.name = updateTemplateTemplate.name;
      return this.templateRepository.save(template);
    } catch (e) {
      throw e;
    }
  }

  async getAll(offset: number = 0, limit: number = 9, user: User) {
    try {
      const templates = await this.templateRepository.find({
        relations: ['tasks'],
        skip: offset,
        take: limit,
      });

      let templateInfo = templates.map((template) => ({
        id: template.id,
        name: template.name,
        count: template.tasks.length,
      }));

      if (user?.roles?.some((role: any) => role.name === UserRole.USER)) {
        templateInfo = templateInfo.filter((el) => el.count !== 0);
      }

      return templateInfo;
    } catch (e) {
      throw e;
    }
  }

  async getTemplateById(id: number): Promise<any> {
    try {
      const template = await this.templateRepository.findOne({
        where: { id },
        relations: ['tasks'],
      });

      if (!template) {
        throw new ApiError('Template not found', 404);
      }

      template.tasks.sort((a, b) => a.id - b.id);

      const taskCount = template.tasks.length;

      return { template, taskCount };
    } catch (e) {
      throw e;
    }
  }

  async deleteTemplate(id: number): Promise<any> {
    try {
      const template = await this.templateRepository.findOne({
        where: { id },
      });

      if (!template) {
        throw new ApiError('Template not found', 404);
      }

      await this.templateRepository.delete(id);
      return { message: 'Template deleted successfully' };
    } catch (e) {
      throw e;
    }
  }

  async findById(id: number): Promise<Template> {
    try {
      const template = await this.templateRepository.findOne({
        where: { id },
        relations: ['tasks'],
      });

      if (!template) {
        throw new ApiError('Template not found', 404);
      }
      return template;
    } catch (e) {
      throw e;
    }
  }
}
