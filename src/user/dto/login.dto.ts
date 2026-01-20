import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class LoginDto {
    @ApiProperty({
        example: 'abdelrahman@gmail.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
    @ApiProperty({
        example: 'password',
    })
    @IsNotEmpty()
    password: string;
}