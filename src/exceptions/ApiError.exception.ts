import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiError extends HttpException {
  constructor(message: string, code: HttpStatus) {
    super({ message, code }, code);
  }
}
