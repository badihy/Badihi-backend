import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MobileGoogleSignInDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6I...',
    description:
      'Google ID token from the client app. Legacy option when the client sends the ID token directly. The token audience must match GOOGLE_CLIENT_ID.',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
