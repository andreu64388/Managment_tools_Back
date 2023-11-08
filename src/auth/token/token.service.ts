import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { Repository } from 'typeorm';

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
    try {
      const decodedToken = this.jwtService.verify(token);
      return decodedToken;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  getEmailFromToken(token: string) {
    console.log('token');
    const decodedToken = this.verifyToken(token);
    if (decodedToken && decodedToken['email']) {
      console.log('token tis');
      return decodedToken['email'];
    } else {
      throw new Error('Invalid token or missing email in the token payload');
    }
  }

  async saveToken(token: string, userId: number) {
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
