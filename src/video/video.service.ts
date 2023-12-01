import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from 'src/exceptions/ApiError.exception';

const accessFilesExtensions = [
  '.mp4',
  '.avi',
  '.mkv',
  '.mov',
  '.wmv',
  '.flv',
  '.webm',
];

@Injectable()
export class VideoService {
  async sendVideo(videoPath: string, range: string, res) {
    const videoStat = fs.statSync(videoPath);
    const fileSize = videoStat.size;
    const CHUNK_SIZE = 10 ** 6;

    if (!range) {
      const headers = {
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize,
      };
      res.writeHead(200, headers);

      const videoStream = fs.createReadStream(videoPath);
      videoStream.pipe(res);
    } else {
      const start = Number(range.replace(/\D/g, ''));
      const end = Math.min(start + CHUNK_SIZE, fileSize - 1);

      const contentLength = end - start + 1;

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, headers);

      const videoStream = fs.createReadStream(videoPath, { start, end });
      videoStream.pipe(res);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!accessFilesExtensions.includes(path.extname(file.originalname))) {
      throw new ApiError('File type not supported', 400);
    }

    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join('uploads', fileName);

    return new Promise<string>((resolve, reject) => {
      const uploadDirectory = path.join(process.cwd(), 'uploads');

      fs.mkdir(uploadDirectory, { recursive: true }, (mkdirError) => {
        if (mkdirError) {
          return reject(`Failed to create directory: ${mkdirError}`);
        }

        fs.writeFile(filePath, file.buffer, (writeError) => {
          if (writeError) {
            return reject(`Failed to write file: ${writeError}`);
          }
          resolve(fileName);
        });
      });
    });
  }

  async getVideoPath(videoName: string): Promise<string> {
    try {
      const videoPath = path.join(process.cwd(), 'uploads', videoName);

      if (!fs.existsSync(videoPath)) {
        throw new ApiError('Video not found', 404);
      }

      return videoPath;
    } catch (error) {
      throw error;
    }
  }

  async deleteVideo(videoName: string): Promise<any> {
    try {
      const videoPath = await this.getVideoPath(videoName);

      fs.unlinkSync(videoPath);

      return true;
    } catch (error) {
      throw new Error(`Failed to delete video: ${error}`);
    }
  }
}
