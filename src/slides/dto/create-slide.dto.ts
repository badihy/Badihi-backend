import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsArray,
  IsEnum,
} from 'class-validator';
import { SlideType } from '../types/slide-types.enum';

export class CreateSlideDto {
  @ApiProperty({ example: SlideType.TEXT, enum: SlideType })
  @IsEnum(SlideType)
  @IsNotEmpty()
  type: SlideType;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  orderIndex: number;

  @ApiProperty({
    example: '60d5ecb8b392d663c0f22a11',
    description: 'Lesson ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  lesson: string;

  // TEXT fields
  @ApiPropertyOptional({ example: 'Introduction Slide' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'This is the content of the slide' })
  @IsString()
  @IsOptional()
  textContent?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  // Common for TEXT and QUESTION
  @ApiPropertyOptional({ example: 'Important info' })
  @IsString()
  @IsOptional()
  golden_info?: string;

  @ApiPropertyOptional({ example: 'Detailed explanation' })
  @IsString()
  @IsOptional()
  explanation?: string;

  // QUESTION fields
  @ApiPropertyOptional({ example: 'What is the capital of France?' })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({
    example: ['Paris', 'London', 'Berlin'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  choices?: string[];

  @ApiPropertyOptional({ example: 'Paris' })
  @IsString()
  @IsOptional()
  answer?: string;

  // QUOTE fields
  @ApiPropertyOptional({ example: 'To be or not to be' })
  @IsString()
  @IsOptional()
  quotation?: string;

  @ApiPropertyOptional({ example: 'William Shakespeare' })
  @IsString()
  @IsOptional()
  authorName?: string;

  @ApiPropertyOptional({ example: 'Playwright' })
  @IsString()
  @IsOptional()
  authorJob?: string;
}
