import { PartialType } from '@nestjs/swagger';
import { CreateChapterDto } from './create-chapter.dto';

/** جميع الحقول اختيارية لتحديث جزئي للفصل */
export class UpdateChapterDto extends PartialType(CreateChapterDto) {}
