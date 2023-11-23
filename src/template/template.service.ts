import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { User } from 'src/user/entities/user.entity';
import { UserRole } from 'src/role/role.enum';
import { CreateTemplateDto } from './dto/create-template.dto';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  async create(createTemplateDto: CreateTemplateDto): Promise<Template> {
    try {
      const template = this.templateRepository.create({
        name: createTemplateDto.name,
        prepTime: createTemplateDto.prepTime,
        idealPreReq: createTemplateDto.idealPreReq,
        duration: createTemplateDto.duration,
      });

      return this.templateRepository.save(template);
    } catch (e) {
      throw new ApiError("Couldn't create template", 400);
    }
  }

  async update(updateTemplateTemplate: UpdateTemplateDto) {
    try {
      const template = await this.findTemplateById(
        updateTemplateTemplate.templateId,
      );
      template.name = updateTemplateTemplate.name;
      template.prepTime = updateTemplateTemplate.prepTime;
      template.idealPreReq = updateTemplateTemplate.idealPreReq;
      template.duration = updateTemplateTemplate.duration;

      await this.templateRepository.save(template);

      const templateWithoutTasks = {
        id: template.id,
        name: template.name,
        prepTime: template.prepTime,
        idealPreReq: template.idealPreReq,
        duration: template.duration,
      };

      return templateWithoutTasks;
    } catch (e) {
      throw new ApiError("Couldn't update template", 400);
    }
  }

  async getAll(offset: number = 0, limit: number = 9, user: User) {
    try {
      const templates = await this.templateRepository.find({
        relations: ['tasks'],
        order: { id: 'ASC' },
        skip: offset,
        take: limit,
      });

      let templateInfo = templates.map((template) => ({
        id: template.id,
        name: template?.name,
        count: template?.tasks?.length,
        prepTime: template?.prepTime,
        idealPreReq: template?.idealPreReq,
        duration: template?.duration,
      }));

      if (this.isUserWithUserRole(user)) {
        templateInfo = templateInfo.filter((el) => el.count !== 0);
      }

      if (templateInfo) return templateInfo;
    } catch (e) {
      throw new ApiError("Couldn't get templates", 400);
    }
  }

  async getTemplateById(id: string): Promise<any> {
    try {
      if (!uuidValidate(id)) {
        throw new ApiError('Valid format id', 400);
      }
      const template = await this.findTemplateById(id);

      if (!template) throw new ApiError('Template not found', 404);

      template.tasks.sort((a, b) => {
        const dateA = a.createAt.getTime();
        const dateB = b.createAt.getTime();
        return dateA - dateB;
      });

      const taskCount = template?.tasks?.length;
      const templateWithoutTasks = {
        id: template?.id,
        name: template?.name,
        taskCount: taskCount,
        prepTime: template?.prepTime,
        idealPreReq: template?.idealPreReq,
        duration: template?.duration,
      };

      return templateWithoutTasks;
    } catch (e) {
      throw e;
    }
  }

  async getTaskByTemplateId(
    id: string,
    offset: number = 0,
    limit: number = 5,
  ): Promise<any> {
    try {
      const template = await this.findTemplateById(id);

      if (!template) throw new ApiError('Template not found', 404);

      template.tasks.sort((a, b) => {
        const dateA = a.createAt.getTime();
        const dateB = b.createAt.getTime();
        return dateA - dateB;
      });

      const startIndex = Number(offset);
      const endIndex = Number(offset) + Number(limit);
      const slicedPlans = template.tasks.slice(startIndex, endIndex);
      return slicedPlans;
    } catch (e) {
      throw e;
    }
  }

  async deleteTemplate(id: string): Promise<any> {
    const template = await this.findTemplateById(id);

    if (!template) throw new ApiError('Template not found', 404);

    await this.templateRepository.delete(template.id);
    return { message: 'Template deleted successfully' };
  }

  async findById(id: string): Promise<Template> {
    return this.findTemplateById(id);
  }

  private async findTemplateById(id: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['tasks'],
    });

    return template;
  }

  async findTemplateByIdWithRelations(
    id: string,
  ): Promise<Template | undefined> {
    return await this.templateRepository.findOne({
      where: { id },
      relations: ['tasks', 'plans'],
    });
  }
  private isUserWithUserRole(user: User): boolean {
    return user?.roles?.some((role: any) => role.name === UserRole.USER);
  }
}
