import { Injectable } from '@nestjs/common';
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

  async update(updateTemplateTemplate: UpdateTemplateDto) {
    const template = await this.findTemplateById(
      updateTemplateTemplate.templateId,
    );
    template.name = updateTemplateTemplate.name;
    this.templateRepository.save(template);

    const templateWithoutTasks = {
      id: template.id,
      name: template.name,
    };

    return templateWithoutTasks;
  }

  async getAll(offset: number = 0, limit: number = 9, user: User) {
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

    if (this.isUserWithUserRole(user)) {
      templateInfo = templateInfo.filter((el) => el.count !== 0);
    }

    return templateInfo;
  }

  async getTemplateById(id: number): Promise<any> {
    const template = await this.findTemplateById(id);

    template.tasks.sort((a, b) => a.id - b.id);

    const taskCount = template.tasks.length;
    const templateWithoutTasks = {
      id: template.id,
      name: template.name,
      taskCount: taskCount,
    };

    return templateWithoutTasks;
  }

  async getTaskByTemplateId(
    id: number,
    offset: number = 0,
    limit: number = 5,
  ): Promise<any> {
    const template = await this.findTemplateById(id);

    template.tasks.sort((a, b) => a.id - b.id);

    const startIndex = Number(offset);
    const endIndex = Number(offset) + Number(limit);
    const slicedPlans = template.tasks.slice(startIndex, endIndex);
    return slicedPlans;
  }

  async deleteTemplate(id: number): Promise<any> {
    await this.findTemplateById(id);

    await this.templateRepository.delete(id);
    return { message: 'Template deleted successfully' };
  }

  async findById(id: number): Promise<Template> {
    return this.findTemplateById(id);
  }

  private async findTemplateById(id: number): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['tasks'],
    });

    return template;
  }

  private isUserWithUserRole(user: User): boolean {
    return user?.roles?.some((role: any) => role.name === UserRole.USER);
  }
}
