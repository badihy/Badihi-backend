import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from './schemas/certificate.schema';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../courses/schemas/enrollment.schema';
import { Chapter, ChapterDocument } from '../courses/schemas/chapter.schema';

@Injectable()
export class CertificateService {
  constructor(
    @InjectModel(Certificate.name) private readonly certificateModel: Model<CertificateDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Chapter.name) private readonly chapterModel: Model<ChapterDocument>,
  ) { }

  async issue(issueCertificateDto: IssueCertificateDto) {
    const { userId, courseId } = issueCertificateDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new NotFoundException('الكورس غير موجود');
    }

    const enrollment = await this.enrollmentModel.findOne({ user: userId, course: courseId });
    if (!enrollment) {
      throw new BadRequestException('المستخدم غير مسجل في هذا الكورس');
    }

    await this.ensureCourseCompletion(courseId, enrollment);

    const existingCertificate = await this.certificateModel.findOne({ user: userId, course: courseId });
    if (existingCertificate) {
      return existingCertificate;
    }

    return await this.certificateModel.create({
      user: userId,
      course: courseId,
      certificateNumber: this.generateCertificateNumber(),
      issuedAt: new Date(),
      progressAtIssue: enrollment.progress,
    });
  }

  async findByUser(userId: string) {
    return await this.certificateModel
      .find({ user: userId })
      .populate('course', 'name description')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const certificate = await this.certificateModel
      .findById(id)
      .populate('user', 'fullName username email')
      .populate('course', 'name description');

    if (!certificate) {
      throw new NotFoundException('الشهادة غير موجودة');
    }

    return certificate;
  }

  async verifyByNumber(certificateNumber: string) {
    const certificate = await this.certificateModel
      .findOne({ certificateNumber })
      .populate('user', 'fullName username email')
      .populate('course', 'name description');

    if (!certificate) {
      throw new NotFoundException('رقم الشهادة غير صحيح');
    }

    return certificate;
  }

  private async ensureCourseCompletion(courseId: string, enrollment: EnrollmentDocument) {
    const chapters = await this.chapterModel.find({ course: courseId }).select('lessons quiz');

    let totalItems = 0;
    for (const chapter of chapters) {
      if (chapter.lessons?.length) {
        totalItems += chapter.lessons.length;
      }
      if (chapter.quiz) {
        totalItems += 1;
      }
    }

    if (totalItems === 0) {
      throw new BadRequestException('لا يمكن إصدار شهادة قبل إضافة محتوى للكورس');
    }

    const completedItems = enrollment.completedLessons.length + enrollment.completedQuizzes.length;

    if (!enrollment.isCompleted || enrollment.progress < 100 || completedItems < totalItems) {
      throw new BadRequestException('لا يمكن إصدار شهادة قبل إكمال الكورس بالكامل وجميع السلايدات');
    }
  }

  private generateCertificateNumber() {
    const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `CERT-${Date.now()}-${randomPart}`;
  }
}
