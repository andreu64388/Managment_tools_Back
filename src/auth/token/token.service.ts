import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { Repository } from 'typeorm';
import { ApiError } from 'src/exceptions/ApiError.exception';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Token)
    private readonly userRepository: Repository<Token>,
  ) {}

  generateToken(email: string, time: string = '3d') {
    const payload = { email: email };
    const options = { expiresIn: time };
    return this.jwtService.signAsync(payload, options);
  }

  verifyToken(token: string) {
    const decodedToken = this.jwtService.verify(token);
    if (!decodedToken) throw new ApiError('Invalid token', 400);
    return decodedToken;
  }

  getEmailFromToken(token: string) {
    const decodedToken = this.verifyToken(token);
    if (decodedToken && decodedToken['email']) {
      return decodedToken['email'];
    } else {
      throw new ApiError('Invalid token', 400);
    }
  }

  async saveToken(token: string, userId: string) {
    this.verifyToken(token);
    const tokenEntity = new Token();
    tokenEntity.token = token;
    tokenEntity.userId = userId;
    await this.userRepository.save(tokenEntity);
  }

  async removeToken(token: string) {
    const tokenEntity = await this.userRepository.findOne({
      where: { token: token },
    });
    if (tokenEntity) {
      await this.userRepository.remove(tokenEntity);
    }
  }

  async accsessToken(token: string) {
    this.verifyToken(token);
    const tokenEntity = await this.userRepository.findOne({
      where: { token: token },
    });
    return tokenEntity ? true : false;
  }
}
