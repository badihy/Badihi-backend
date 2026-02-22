import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateChapterDto {
    @ApiProperty({ example: 'Introduction to Programming' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Learn the basics of programming' })
    @IsString()
    @IsOptional()
    subtitle?: string;

    @ApiPropertyOptional({ example: 'Learn the basics of programming' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    orderIndex: number;

    @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'Course ID' })
    @IsMongoId()
    @IsNotEmpty()
    course: string;
}
