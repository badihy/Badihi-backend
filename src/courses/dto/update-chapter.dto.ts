import { PartialType } from '@nestjs/swagger';
import { CreateChapterDto } from './create-chapter.dto';

/** All fields are optional for partial chapter updates. */
export class UpdateChapterDto extends PartialType(CreateChapterDto) {}
