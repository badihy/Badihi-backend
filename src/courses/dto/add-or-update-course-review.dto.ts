import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddOrUpdateCourseReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5, description: 'التقييم من 1 إلى 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'دورة ممتازة', description: 'تعليق اختياري' })
  @IsOptional()
  @IsString()
  comment?: string;
}
