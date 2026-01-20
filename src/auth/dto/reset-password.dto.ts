import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { Match } from "../../common/decorators/match/match.decorator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'user@example.com' })
    @IsString()
    @MinLength(8)
    newPassword: string;

    @ApiProperty({ example: 'user@example.com' })
    @IsString()
    @Match('newPassword')
    confirmNewPassword: string;
}
