import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  /**
   * Create a new lesson and link it to its parent chapter
   */
  async createLesson(createLessonDto: CreateLessonDto): Promise<Lesson> {
    const chapter = await this.chapterModel.findById(createLessonDto.chapter).exec();
    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${createLessonDto.chapter} غير موجود`);
    }

    // A chapter that already has a quiz should not accept lessons
    if (chapter.quiz) {
      throw new BadRequestException('لا يمكن إضافة درس لفصل يحتوي على اختبار. يمكن للفصل احتواء دروس أو اختبار فقط.');
    }

    const lesson = new this.lessonModel(createLessonDto);
    const savedLesson = await lesson.save();

    // Push lesson reference into the chapter
    await this.chapterModel.findByIdAndUpdate(
      createLessonDto.chapter,
      { $push: { lessons: savedLesson._id } },
    ).exec();

    return savedLesson;
  }

  /**
   * Get all lessons for a specific chapter
   */
  async findAllLessons(chapterId: string): Promise<Lesson[]> {
    const chapter = await this.chapterModel.findById(chapterId).exec();
    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${chapterId} غير موجود`);
    }

    return this.lessonModel
      .find({ chapter: chapterId })
      .sort({ orderIndex: 1 })
      .populate({ path: 'slides', options: { sort: { orderIndex: 1 } } })
      .exec();
  }

  /**
   * Get a single lesson by ID
   */
  async findOneLesson(id: string): Promise<Lesson> {
    const lesson = await this.lessonModel
      .findById(id)
      .populate({ path: 'slides', options: { sort: { orderIndex: 1 } } })
      .exec();

    if (!lesson) {
      throw new NotFoundException(`الدرس بالمعرف ${id} غير موجود`);
    }

    return lesson;
  }

  /**
   * Update a lesson by ID
   */
  async updateLesson(id: string, updateData: Partial<CreateLessonDto>): Promise<Lesson> {
    const updatedLesson = await this.lessonModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedLesson) {
      throw new NotFoundException(`الدرس بالمعرف ${id} غير موجود`);
    }

    return updatedLesson;
  }

  /**
   * Delete a lesson and remove its reference from the parent chapter
   */
  async removeLesson(id: string): Promise<Lesson> {
    const lesson = await this.lessonModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException(`الدرس بالمعرف ${id} غير موجود`);
    }

    // Remove lesson reference from the parent chapter
    await this.chapterModel.findByIdAndUpdate(
      lesson.chapter,
      { $pull: { lessons: lesson._id } },
    ).exec();

    return (await this.lessonModel.findByIdAndDelete(id).exec())!;
  }
}
