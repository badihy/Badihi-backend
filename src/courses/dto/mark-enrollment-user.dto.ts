import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

/** جسم طلبات التقدم (درس/اختبار) — معرّف المستخدم */
export class MarkEnrollmentUserDto {
  @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'معرّف المستخدم (Mongo ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}
