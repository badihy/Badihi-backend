import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddOrUpdateCourseReviewDto {
  @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'معرّف المستخدم (Mongo ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

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
