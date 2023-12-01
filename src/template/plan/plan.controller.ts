import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth-guard.guard';

@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPlanDto: CreatePlanDto, @Request() req) {
    return await this.planService.create(createPlanDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('completed')
  async getAllCompleted(
    @Request() req,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ) {
    const data = await this.planService.getCompletedPlansByUserId(
      req.user,
      offset,
      limit,
    );
    return data;
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get(':planId')
  async getPlan(@Param('planId') planId: string, @Request() req) {
    const data = await this.planService.getPlanById(planId, req.user);

    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':planId')
  async removePlan(@Param('planId') planId: string, @Request() req) {
    return await this.planService.removePlan(planId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':planId/remove/:taskId')
  async removeTaskFromPlan(
    @Param('planId') planId: string,
    @Param('taskId') taskId: string,
    @Request() req,
  ) {
    return await this.planService.removeTaskFromPlan(planId, taskId, req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Get(':planId/:taskId')
  async getTask(
    @Param('planId') planId: string,
    @Param('taskId') taskId: string,
    @Request() req,
  ) {
    return await this.planService.getTask(planId, taskId, req.user);
  }
}
