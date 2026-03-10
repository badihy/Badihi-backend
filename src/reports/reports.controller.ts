import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Post()
  @ApiOperation({ summary: 'Submit a new user report/problem' })
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by id' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update report status' })
  updateStatus(@Param('id') id: string, @Body() updateReportStatusDto: UpdateReportStatusDto) {
    return this.reportsService.updateStatus(id, updateReportStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
