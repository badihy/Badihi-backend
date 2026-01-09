import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";
import { Match } from "src/common/decorators/match/match.decorator";

export class CreateUserDto {
    @ApiProperty({
        example: 'Abdelrahman Gamgom',
    })
    @IsString()
    fullName: string;
    @ApiProperty({
        example: 'abdelrahman@gmail.com',
    })
    @IsEmail()
    email: string;
    @ApiProperty({
        example: 'password',
    })
    @IsString()
    password: string;

    @ApiProperty({
        example: 'password',
    })
    @IsString()
    @Match('password')
    passwordConfirm: string
    @ApiPropertyOptional({
        example: '0123456789',
    })
    @IsOptional()
    phone?: string;
}
