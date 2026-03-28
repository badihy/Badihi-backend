import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'معرف المستخدم' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '60d5ecb8b392d663c0f22a12', description: 'معرف الدورة التدريبية' })
  @IsMongoId()
  @IsNotEmpty()
  courseId: string;
}
