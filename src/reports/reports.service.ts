import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReportDto } from './dto/create-report.dto';
import { Report, ReportDocument } from './schemas/report.schema';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { BunnyService } from '../common/services/bunny.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    private readonly bunnyService: BunnyService,
  ) { }

  async create(createReportDto: CreateReportDto, file?: any) {
    let imageUrl = createReportDto.imageUrl;
    if (file) {
      imageUrl = await this.bunnyService.uploadFile(file);
    }

    return await this.reportModel.create({
      ...createReportDto,
      imageUrl,
    });
  }

  async findAll() {
    return await this.reportModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new NotFoundException('البلاغ غير موجود');
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
      throw new NotFoundException('البلاغ غير موجود');
    }

    return updatedReport;
  }

  async remove(id: string) {
    const deletedReport = await this.reportModel.findByIdAndDelete(id);
    if (!deletedReport) {
      throw new NotFoundException('البلاغ غير موجود');
    }

    return { message: 'تم حذف البلاغ بنجاح' };
  }
}
