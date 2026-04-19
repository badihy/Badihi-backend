import { ApiPropertyOptional } from '@nestjs/swagger';

/** جسم طلبات التقدم (درس/اختبار) فارغ لأن المستخدم يُستخرج من access token */
export class MarkEnrollmentUserDto {
  @ApiPropertyOptional({
    type: String,
    deprecated: true,
    description: 'لم يعد هذا الحقل مستخدماً؛ يُحدد المستخدم من access token.',
  })
  readonly userId?: string;
}
