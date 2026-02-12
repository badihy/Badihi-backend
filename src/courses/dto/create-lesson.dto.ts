import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateLessonDto {
    @ApiProperty({ example: 'Variables and Data Types' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Understanding different variable types' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    orderIndex: number;

    @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'Section ID' })
    @IsMongoId()
    @IsNotEmpty()
    section: string;

    @ApiPropertyOptional({ example: 15, description: 'Duration in minutes' })
    @IsNumber()
    @IsOptional()
    estimatedDuration?: number;
}
