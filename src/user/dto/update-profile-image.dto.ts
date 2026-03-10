import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProfileImageDto {
  @ApiProperty({
    example: 'https://cdn.example.com/profiles/user-123.jpg',
    format: 'binary'
  })
  @IsString()
  @IsNotEmpty()
  profileImage: string;
}
