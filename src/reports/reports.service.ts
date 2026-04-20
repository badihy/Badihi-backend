import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReportDto } from './dto/create-report.dto';
import { Report, ReportDocument } from './schemas/report.schema';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { BunnyService } from '../common/services/bunny.service';
import { PaginationProvider } from '../common/providers/pagination.provider';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    private readonly bunnyService: BunnyService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  async create(createReportDto: CreateReportDto, file?: any) {
    let imageUrl = createReportDto.imageUrl;
    if (file) {
      try {
        imageUrl = await this.bunnyService.uploadFile(file);
      } catch (error: any) {
        throw new BadRequestException(
          `Failed to upload report image: ${error?.message || ''}`,
        );
      }
    }

    return await this.reportModel.create({
      ...createReportDto,
      imageUrl,
    });
  }

  async findAll(query: ReportQueryDto) {
    return this.paginationProvider.paginate(this.reportModel, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      searchIn: ['subject', 'message', 'name', 'email'],
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async findOne(id: string) {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async updateStatus(id: string, updateReportStatusDto: UpdateReportStatusDto) {
    const updatedReport = await this.reportModel.findByIdAndUpdate(
      id,
      { status: updateReportStatusDto.status },
      { new: true },
    );

    if (!updatedReport) {
      throw new NotFoundException('Report not found');
    }

    return updatedReport;
  }

  async remove(id: string) {
    const deletedReport = await this.reportModel.findByIdAndDelete(id);
    if (!deletedReport) {
      throw new NotFoundException('Report not found');
    }

    return { message: 'Report deleted successfully' };
  }
}
