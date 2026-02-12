import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsMongoId, IsEnum } from 'class-validator';
import { CourseLevel } from '../types/course-level.enum';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
    @ApiProperty({ example: 'Introduction to NestJS' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Learn the basics of NestJS framework' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ example: 'A comprehensive guide to building scalable applications with NestJS', description: 'Short description of the course' })
    @IsString()
    @IsOptional()
    shortDescription?: string;

    @ApiProperty({ example: 49.99 })
    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => {
        const num = Number(value);
        if (isNaN(num)) {
            return value; // Let validation handle the error
        }
        return num;
    })
    price: number;

    @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'Category ID' })
    @IsMongoId()
    @IsNotEmpty()
    category: string;

    @ApiPropertyOptional({ example: ['Dependency Injection', 'Modules'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [value];
            } catch {
                // If not JSON, treat as comma-separated or single value
                return value.split(',').map(item => item.trim()).filter(item => item);
            }
        }
        return value;
    })
    willLearn?: string[];

    @ApiPropertyOptional({ example: ['Basic JavaScript'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [value];
            } catch {
                // If not JSON, treat as comma-separated or single value
                return value.split(',').map(item => item.trim()).filter(item => item);
            }
        }
        return value;
    })
    requirements?: string[];

    @ApiPropertyOptional({ example: ['Developers', 'Students', 'Beginners'], type: [String], description: 'Target audience for this course' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [value];
            } catch {
                // If not JSON, treat as comma-separated or single value
                return value.split(',').map(item => item.trim()).filter(item => item);
            }
        }
        return value;
    })
    targetAudience?: string[];

    @ApiPropertyOptional({ example: CourseLevel.BEGINNER, enum: CourseLevel, description: 'Course difficulty level' })
    @IsOptional()
    @IsEnum(CourseLevel)
    level?: CourseLevel;

    @ApiProperty({ example: '10 hours' })
    @IsString()
    @IsNotEmpty()
    estimationTime: string;

    @ApiPropertyOptional({ example: 'https://example.com/cover.png' , format:'binary' })
    @IsString()
    @IsOptional()
    coverImage?: string;

    @ApiPropertyOptional({ example: 'https://example.com/thumbnail.png' , format:'binary'  })
    @IsString()
    @IsOptional()
    thumbnailImage?: string;
}
