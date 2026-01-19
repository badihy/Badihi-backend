import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from 'src/user/dto/login.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from 'src/user/schemas/user.schema';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) { }

    async login(loginDto: LoginDto): Promise<{ token: string, user: Omit<User, 'password'> & { _id: any } }> {
        const user = await this.userService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid Credentials');
        }
        const token = this.jwtService.sign({ id: user._id }, { expiresIn: '7d' });
        return {
            token, user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                fullName: user.fullName,
            }
        };
    }
}
