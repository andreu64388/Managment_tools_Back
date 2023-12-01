import {
  Controller,
  Get,
  Param,
  Headers,
  Res,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { RolesGuard } from 'src/guards/roles-guard';
import { Roles } from 'src/decorator/roles.decorator';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':videoName')
  async deleteVideo(@Param('videoName') videoName: string) {
    return await this.videoService.deleteVideo(videoName);
  }

  @Get(':videoName')
  async streamVideo(
    @Param('videoName') videoName: string,
    @Headers('range') range: string,
    @Res() res,
  ) {
    try {
      const videoPath = await this.videoService.getVideoPath(videoName);
      await this.videoService.sendVideo(videoPath, range, res);
    } catch (error) {
      res.status(500).end();
    }
  }
}
