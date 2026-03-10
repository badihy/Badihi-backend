import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class FirebaseLoginDto {
    @ApiProperty({
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6I...',
        description: 'Firebase ID token obtained from client SDK after Google sign-in',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    idToken?: string;

    @ApiProperty({
        example: 'abc123XYZfirebaseUID',
        description: 'Optional legacy field. Not required if idToken is provided.',
        required: false,
    })
    @IsOptional()
    @IsString()
    uid?: string;
}
