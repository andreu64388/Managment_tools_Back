import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth-guard.guard';

@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  async create(@Body() createPlanDto: CreatePlanDto, @Request() req) {
    return await this.planService.create(createPlanDto, req.user);
  }

  @Get('completed')
  async getAllCompleted(
    @Request() req,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ) {
    return await this.planService.getCompletedPlansByUserId(
      req.user,
      offset,
      limit,
    );
  }

  @Get('uncompleted')
  async getAllUnCompleted(
    @Request() req,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ) {
    return await this.planService.getUncompletedPlansByUserId(
      req.user,
      offset,
      limit,
    );
  }

  @Get(':planId')
  async getPlan(@Param('planId') planId: string, @Request() req) {
    return await this.planService.getPlanById(planId, req.user);
  }

  @Delete(':planId')
  async removePlan(@Param('planId') planId: string, @Request() req) {
    return await this.planService.removePlan(planId, req.user);
  }
  @Delete(':planId/remove/:taskId')
  async removeTaskFromPlan(
    @Param('planId') planId: string,
    @Param('taskId') taskId: string,
    @Request() req,
  ) {
    return await this.planService.removeTaskFromPlan(planId, taskId, req.user);
  }

  @Get(':planId/:taskId')
  async getTask(
    @Param('planId') planId: string,
    @Param('taskId') taskId: string,
    @Request() req,
  ) {
    return await this.planService.getTask(planId, taskId, req.user);
  }
}
