import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDTO, SignupDTO } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    signup(dto: SignupDTO): Promise<{
        token: string;
        username: string;
        email: string;
    }>;
    login(dto: LoginDTO): Promise<{
        token: string;
        username: string;
        email: string;
    }>;
    private generateToken;
}
