import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ReportStatus, ReportType } from '../schemas/report.schema';

export class ReportQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReportStatus, example: ReportStatus.PENDING })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: ReportType, example: ReportType.PROBLEM })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;
}
