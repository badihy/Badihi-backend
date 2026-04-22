import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateLockStatusDto {
  @ApiProperty({
    example: true,
    description: 'Whether the chapter or lesson is manually locked',
  })
  @IsBoolean()
  isLocked: boolean;
}
