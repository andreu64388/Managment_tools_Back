import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Delete,
  Param,
  ParseIntPipe,
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

  @Get()
  async getAll(@Request() req) {
    return await this.planService.getPlansByUserId(req.user);
  }

  @Get(':planId')
  async getPlan(@Param('planId', ParseIntPipe) planId: number, @Request() req) {
    if (planId) return await this.planService.getPlanById(planId, req.user);
  }

  @Delete(':planId')
  async removePlan(
    @Param('planId', ParseIntPipe) planId: number,
    @Request() req,
  ) {
    return await this.planService.removePlan(planId, req.user);
  }
  @Delete(':planId/remove/:taskId')
  async removeTaskFromPlan(
    @Param('planId', ParseIntPipe) planId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req,
  ) {
    return await this.planService.removeTaskFromPlan(planId, taskId, req.user);
  }

  @Get(':planId/:taskId')
  async getTask(
    @Param('planId', ParseIntPipe) planId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req,
  ) {
    return await this.planService.getTask(planId, taskId, req.user);
  }
}
