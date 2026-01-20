import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsMongoId } from 'class-validator';

export class CreateCourseDto {
    @ApiProperty({ example: 'Introduction to NestJS' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Learn the basics of NestJS framework' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 49.99 })
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'Category ID' })
    @IsMongoId()
    @IsNotEmpty()
    category: string;

    @ApiPropertyOptional({ example: ['Dependency Injection', 'Modules'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    willLearn?: string[];

    @ApiPropertyOptional({ example: ['Basic JavaScript'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requirements?: string[];

    @ApiProperty({ example: '10 hours' })
    @IsString()
    @IsNotEmpty()
    estimationTime: string;

    @ApiPropertyOptional({ example: 'https://example.com/cover.png' })
    @IsString()
    @IsOptional()
    coverImage?: string;

    @ApiPropertyOptional({ example: 'https://example.com/thumbnail.png' })
    @IsString()
    @IsOptional()
    thumbnailImage?: string;
}
