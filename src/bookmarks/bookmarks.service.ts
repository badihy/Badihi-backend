import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bookmark, BookmarkDocument } from './schemas/bookmark.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async add(userId: string, courseId: string): Promise<Bookmark> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${courseId} غير موجودة`);
    }

    const existing = await this.bookmarkModel.findOne({ user: userId, course: courseId }).exec();
    if (existing) {
      throw new BadRequestException('الدورة موجودة بالفعل في المفضلة');
    }

    const bookmark = new this.bookmarkModel({ user: userId, course: courseId });
    return bookmark.save();
  }

  async remove(userId: string, courseId: string): Promise<void> {
    const result = await this.bookmarkModel.deleteOne({ user: userId, course: courseId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('الإشارة المرجعية غير موجودة');
    }
  }

  async findByUser(userId: string): Promise<any[]> {
    const items = await this.bookmarkModel
      .find({ user: userId })
      .populate({
        path: 'course',
        populate: { path: 'category' },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return items.map((b: any) => ({
      _id: b._id,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      course: b.course,
    }));
  }

  async isBookmarked(userId: string, courseId: string): Promise<{ bookmarked: boolean }> {
    const found = await this.bookmarkModel.findOne({ user: userId, course: courseId }).exec();
    return { bookmarked: !!found };
  }
}
