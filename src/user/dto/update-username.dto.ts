import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUsernameDto {
  @ApiProperty({
    example: 'abdelrahman_99',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
