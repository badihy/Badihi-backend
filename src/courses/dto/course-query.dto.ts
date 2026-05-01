import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PopulateLevel {
  NONE = 'none',
  CHAPTERS = 'chapters',
  LESSONS = 'lessons',
  SLIDES = 'slides',
  QUIZZES = 'quizzes',
  FULL = 'full',
}

export class CourseQueryDto {
  @ApiPropertyOptional({
    enum: PopulateLevel,
    description:
      'Level of population: none, chapters, lessons, slides, quizzes, full',
    example: PopulateLevel.CHAPTERS,
  })
  @IsOptional()
  @IsEnum(PopulateLevel)
  populate?: PopulateLevel;

  @ApiPropertyOptional({
    description:
      'Include category information (query: true/false, 1/0, or omit)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const v = value.toLowerCase().trim();
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
    }
    return value;
  })
  @IsBoolean()
  includeCategory?: boolean;
}
