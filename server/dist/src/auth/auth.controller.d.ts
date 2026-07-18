import { AuthService } from "./auth.service";
import { LoginDTO, SignupDTO } from "./dto/auth.dto";
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
}
