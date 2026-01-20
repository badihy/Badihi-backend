import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Electronics' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'https://example.com/image.png' })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiPropertyOptional({ example: 'Category for electronic devices' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ required: false, example: '60d5ecb8b392d663c0f22a11' })
    @IsOptional()
    @IsString()
    parent?: string;
}