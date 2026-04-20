import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class IssueCertificateDto {
  @ApiProperty({ example: '65f2d920f11b2a2ef2a63f11' })
  @IsMongoId()
  courseId: string;
}
