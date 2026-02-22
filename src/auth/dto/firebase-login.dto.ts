import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class FirebaseLoginDto {
    @ApiProperty({
        example: 'abc123XYZfirebaseUID',
        description: 'Firebase User UID obtained from the Firebase client SDK after sign-in',
    })
    @IsString()
    @IsNotEmpty()
    uid: string;
}
