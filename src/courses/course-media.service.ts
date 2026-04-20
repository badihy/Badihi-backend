import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { BunnyService } from '../common/services/bunny.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDocument } from './schemas/course.schema';

@Injectable()
export class CourseMediaService {
  constructor(private readonly bunnyService: BunnyService) {}

  async prepareCreateMedia(
    createCourseDto: CreateCourseDto,
    files: { coverImage?: any[]; thumbnailImage?: any[] },
  ) {
    const { coverImage, thumbnailImage } = files;

    let coverImageUrl = createCourseDto.coverImage;
    let thumbnailImageUrl = createCourseDto.thumbnailImage;

    if (coverImage?.[0]) {
      coverImageUrl = await this.uploadCourseImage(
        coverImage[0],
        'صورة الغلاف',
      );
    }

    if (thumbnailImage?.[0]) {
      try {
        thumbnailImageUrl = await this.uploadCourseImage(
          thumbnailImage[0],
          'الصورة المصغرة',
        );
      } catch (error) {
        if (coverImageUrl && coverImageUrl !== createCourseDto.coverImage) {
          await this.bunnyService.removeFileIfExists(coverImageUrl);
        }
        throw error;
      }
    }

    return {
      coverImage: coverImageUrl,
      thumbnailImage: thumbnailImageUrl,
    };
  }

  async prepareUpdateMedia(
    existingCourse: CourseDocument,
    updateCourseDto: UpdateCourseDto,
    files?: { cover?: any[]; thumbnail?: any[] },
  ) {
    const updateData: Record<string, unknown> = { ...updateCourseDto };

    if (files?.cover?.[0]) {
      updateData.coverImage = await this.uploadCourseImage(
        files.cover[0],
        'صورة الغلاف',
      );
      if (
        existingCourse.coverImage &&
        existingCourse.coverImage !== updateCourseDto.coverImage &&
        existingCourse.coverImage.startsWith('https://')
      ) {
        await this.bunnyService.removeFileIfExists(existingCourse.coverImage);
      }
    }

    if (files?.thumbnail?.[0]) {
      try {
        updateData.thumbnailImage = await this.uploadCourseImage(
          files.thumbnail[0],
          'الصورة المصغرة',
        );
      } catch (error) {
        if (
          typeof updateData.coverImage === 'string' &&
          updateData.coverImage !== existingCourse.coverImage
        ) {
          await this.bunnyService.removeFileIfExists(updateData.coverImage);
        }
        throw error;
      }

      if (
        existingCourse.thumbnailImage &&
        existingCourse.thumbnailImage !== updateCourseDto.thumbnailImage &&
        existingCourse.thumbnailImage.startsWith('https://')
      ) {
        await this.bunnyService.removeFileIfExists(
          existingCourse.thumbnailImage,
        );
      }
    }

    return updateData;
  }

  async cleanupCourseMedia(
    course: Pick<CourseDocument, 'coverImage' | 'thumbnailImage'>,
  ) {
    await Promise.allSettled([
      this.removeRemoteCourseImage(course.coverImage),
      this.removeRemoteCourseImage(course.thumbnailImage),
    ]);
  }

  private async uploadCourseImage(file: Express.Multer.File, label: string) {
    try {
      return await this.bunnyService.uploadFile(file);
    } catch (error: any) {
      const message = error?.message || 'تعذر رفع الملف';
      if (
        typeof message === 'string' &&
        (message.includes('الملف') ||
          message.includes('مهلة') ||
          message.includes('الاتصال') ||
          message.includes('Bunny'))
      ) {
        throw new BadRequestException(`فشل تحميل ${label}: ${message}`);
      }

      throw new InternalServerErrorException(`فشل تحميل ${label}`);
    }
  }

  private async removeRemoteCourseImage(fileUrl?: string) {
    if (!fileUrl || !fileUrl.startsWith('https://')) {
      return;
    }

    await this.bunnyService.removeFileIfExists(fileUrl);
  }
}
