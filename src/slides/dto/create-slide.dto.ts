import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsMongoId, IsArray, IsEnum } from 'class-validator';
import { SlideType } from '../types/slide-types.enum';

export class CreateSlideDto {
    @ApiProperty({ example: 'Introduction Slide' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: SlideType.TEXT, enum: SlideType })
    @IsEnum(SlideType)
    @IsNotEmpty()
    type: SlideType;

    @ApiPropertyOptional({ example: 'This is the content of the slide' })
    @IsString()
    @IsOptional()
    textContent?: string;

    @ApiPropertyOptional({ example: 'https://example.com/image.png' })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    orderIndex: number;

    @ApiPropertyOptional({ example: ['Question 1', 'Question 2'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    questions?: string[];

    @ApiPropertyOptional({ example: 'Hint for the question' })
    @IsString()
    @IsOptional()
    questionHint?: string;

    @ApiPropertyOptional({ example: 'Answer to the question' })
    @IsString()
    @IsOptional()
    answer?: string;

    @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'Lesson ID' })
    @IsMongoId()
    @IsNotEmpty()
    lesson: string;
}
