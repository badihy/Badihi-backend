import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { Match } from "../../common/decorators/match/match.decorator";

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(8)
    newPassword: string;

    @IsString()
    @Match('newPassword')
    confirmNewPassword: string;
}
