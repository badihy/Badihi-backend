import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBooleanString } from 'class-validator';
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
    description: 'Level of population: none, chapters, lessons, slides, quizzes, full',
    example: PopulateLevel.CHAPTERS,
  })
  @IsOptional()
  @IsEnum(PopulateLevel)
  populate?: PopulateLevel;

  @ApiPropertyOptional({
    description: 'Include category information',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  @Transform(({ value }) => value === 'true')
  includeCategory?: boolean;
}
