import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsMongoId, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizQuestionDto {
    @ApiProperty({ example: 'What is the capital of France?' })
    @IsString()
    @IsNotEmpty()
    question: string;

    @ApiProperty({ example: ['Paris', 'London', 'Berlin', 'Madrid'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(2)
    options: string[];

    @ApiProperty({ example: 0, description: 'Index of correct answer' })
    @IsNumber()
    @IsNotEmpty()
    correctAnswer: number;

    @ApiPropertyOptional({ example: 'Paris is the capital and largest city of France' })
    @IsString()
    @IsOptional()
    explanation?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    orderIndex: number;
}

export class CreateQuizDto {
    @ApiProperty({ example: 'Chapter 1 Quiz' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Test your knowledge of Chapter 1' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: '60d5ecb8b392d663c0f22a11', description: 'Chapter ID' })
    @IsMongoId()
    @IsNotEmpty()
    chapter: string;

    @ApiProperty({ type: [QuizQuestionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuizQuestionDto)
    @ArrayMinSize(1)
    questions: QuizQuestionDto[];

    @ApiPropertyOptional({ example: 70, description: 'Passing score percentage (0-100)' })
    @IsNumber()
    @IsOptional()
    passingScore?: number;

    @ApiPropertyOptional({ example: 30, description: 'Time limit in minutes' })
    @IsNumber()
    @IsOptional()
    timeLimit?: number;
}
