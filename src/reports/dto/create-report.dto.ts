import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportType } from '../schemas/report.schema';

export class CreateReportDto {
  @ApiPropertyOptional({ example: '65f2d8f2f11b2a2ef2a63f10' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ example: 'Ahmed Ali' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Problem with course videos' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Videos stop after 10 seconds on Android.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    type: String,
    format: 'binary',
    description: 'صورة اختيارية للبلاغ',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: ReportType, example: ReportType.PROBLEM })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;
}
