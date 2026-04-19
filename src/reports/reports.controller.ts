import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Reports')
@ApiBearerAuth('JWT-access')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Post()
  @ApiOperation({ summary: 'Submit a new user report/problem' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    // Some clients send the uploaded file under "imageUrl" (matches DTO field name)
    { name: 'imageUrl', maxCount: 1 },
  ]))
  create(
    @Body() createReportDto: CreateReportDto,
    @UploadedFiles() files?: { image?: any[]; imageUrl?: any[] },
  ) {
    const file = files?.image?.[0] || files?.imageUrl?.[0];
    return this.reportsService.create(createReportDto, file);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all reports' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get report by id' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update report status' })
  updateStatus(@Param('id') id: string, @Body() updateReportStatusDto: UpdateReportStatusDto) {
    return this.reportsService.updateStatus(id, updateReportStatusDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete report' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
