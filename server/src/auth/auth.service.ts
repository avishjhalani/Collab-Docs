// server/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDTO, SignupDTO } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDTO) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existingUser) {
      throw new ConflictException("Email already Registered");
    }

    // Use hashSync to avoid Promise and typings issues
    const hashedPassword = bcrypt.hashSync(dto.password!, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        username: dto.username,
      },
    });

    const token = this.generateToken(user.id, user.username, user.email);
    return { token, username: user.username, email: user.email };
  }

  async login(dto: LoginDTO) {
    const Loginuser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!Loginuser) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Use compareSync for clean typings
    const isPasswordValid = bcrypt.compareSync(dto.password!, Loginuser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Incorrect Password");
    }

    const token = this.generateToken(Loginuser.id, Loginuser.username, Loginuser.email);
    return { token, username: Loginuser.username, email: Loginuser.email };
  }

  private generateToken(userId: string, username: string, email: string) {
    return this.jwtService.sign({ sub: userId, username, email });
  }
}