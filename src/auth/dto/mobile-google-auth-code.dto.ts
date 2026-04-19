import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MobileGoogleAuthCodeDto {
  @ApiProperty({
    example: '4/0AVMBsJjExampleServerAuthCode',
    description:
      'One-time Google server auth code from the mobile app. The backend exchanges it with Google using GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
  })
  @IsString()
  @IsNotEmpty()
  serverAuthCode: string;
}
