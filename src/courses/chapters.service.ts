import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Course, CourseDocument } from './schemas/course.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import {
  EnrollmentsService,
  CourseProgressAccess,
} from './enrollments.service';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  /**
   * Create a new chapter and link it to its parent course
   */
  async createChapter(createChapterDto: CreateChapterDto): Promise<Chapter> {
    const course = await this.courseModel
      .findById(createChapterDto.course)
      .exec();
    if (!course) {
      throw new NotFoundException(
        `الدورة التدريبية بالمعرف ${createChapterDto.course} غير موجودة`,
      );
    }

    const chapter = new this.chapterModel(createChapterDto);
    const savedChapter = await chapter.save();

    // Push chapter reference into the course
    await this.courseModel
      .findByIdAndUpdate(createChapterDto.course, {
        $push: { chapters: savedChapter._id },
      })
      .exec();

    return savedChapter;
  }

  /**
   * Get all chapters for a specific course
   */
  async findAllChapters(courseId: string, userId?: string): Promise<any[]> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(
        `الدورة التدريبية بالمعرف ${courseId} غير موجودة`,
      );
    }

    const chapters = await this.chapterModel
      .find({ course: courseId })
      .sort({ orderIndex: 1 })
      .populate({ path: 'lessons', options: { sort: { orderIndex: 1 } } })
      .populate('quiz')
      .exec();

    if (!userId) {
      return chapters;
    }

    const access = await this.enrollmentsService.getCourseProgressAccess(
      courseId,
      userId,
    );

    return this.applyChapterLocks(chapters, access);
  }

  /**
   * Get a single chapter by ID
   */
  async findOneChapter(id: string, userId?: string): Promise<Chapter> {
    if (userId) {
      await this.enrollmentsService.assertChapterAccessibleById(userId, id);
    }

    const chapter = await this.chapterModel
      .findById(id)
      .populate({ path: 'lessons', options: { sort: { orderIndex: 1 } } })
      .populate('quiz')
      .exec();

    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${id} غير موجود`);
    }

    return chapter;
  }

  /**
   * Update a chapter by ID
   */
  async updateChapter(
    id: string,
    updateData: UpdateChapterDto,
  ): Promise<Chapter> {
    const updatedChapter = await this.chapterModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedChapter) {
      throw new NotFoundException(`الفصل بالمعرف ${id} غير موجود`);
    }

    return updatedChapter;
  }

  /**
   * Delete a chapter and cascade-delete its lessons; remove reference from the course
   */
  async removeChapter(id: string): Promise<Chapter> {
    const chapter = await this.chapterModel.findById(id).exec();
    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${id} غير موجود`);
    }

    // Cascade delete lessons belonging to this chapter
    if (chapter.lessons && chapter.lessons.length > 0) {
      await this.lessonModel.deleteMany({ chapter: id }).exec();
    }

    // Remove the quiz if it exists
    if (chapter.quiz) {
      await this.quizModel.findByIdAndDelete(chapter.quiz).exec();
    }

    // Remove chapter reference from the parent course
    await this.courseModel
      .findByIdAndUpdate(chapter.course, { $pull: { chapters: chapter._id } })
      .exec();

    return (await this.chapterModel.findByIdAndDelete(id).exec())!;
  }

  private applyChapterLocks(
    chapters: any[],
    access?: CourseProgressAccess,
  ): any[] {
    let previousChaptersCompleted = !!access;

    return chapters.map((chapter: any) => {
      const mapped =
        typeof chapter.toObject === 'function' ? chapter.toObject() : chapter;
      mapped.isLocked = !previousChaptersCompleted;

      this.applyLessonLocks(mapped, access, mapped.isLocked);
      this.applyQuizLock(mapped, access, mapped.isLocked);

      mapped.isCompleted = this.isChapterCompleted(mapped, access);
      previousChaptersCompleted =
        previousChaptersCompleted && mapped.isCompleted;

      return mapped;
    });
  }

  private applyLessonLocks(
    chapter: any,
    access: CourseProgressAccess | undefined,
    forceLocked: boolean,
  ): void {
    if (!Array.isArray(chapter.lessons)) {
      return;
    }

    let previousLessonsCompleted = !forceLocked && !!access;
    for (const lesson of chapter.lessons) {
      const lessonId = this.toIdString(lesson._id);
      lesson.isCompleted = !!access?.completedLessonIds.has(lessonId);
      lesson.isLocked = forceLocked || !previousLessonsCompleted;
      previousLessonsCompleted = previousLessonsCompleted && lesson.isCompleted;
    }
  }

  private applyQuizLock(
    chapter: any,
    access: CourseProgressAccess | undefined,
    forceLocked: boolean,
  ): void {
    if (!chapter.quiz) {
      return;
    }

    const quizId = this.toIdString(chapter.quiz._id ?? chapter.quiz);
    chapter.quiz.isCompleted = !!access?.completedQuizIds.has(quizId);
    chapter.quiz.isLocked = forceLocked || !access;

    if (chapter.quiz.isLocked) {
      delete chapter.quiz.questions;
    }
  }

  private isChapterCompleted(
    chapter: any,
    access?: CourseProgressAccess,
  ): boolean {
    if (!access) {
      return false;
    }

    if (Array.isArray(chapter.lessons) && chapter.lessons.length > 0) {
      return chapter.lessons.every((lesson: any) =>
        access.completedLessonIds.has(this.toIdString(lesson._id)),
      );
    }

    if (chapter.quiz) {
      return access.completedQuizIds.has(
        this.toIdString(chapter.quiz._id ?? chapter.quiz),
      );
    }

    return true;
  }

  private toIdString(value: any): string {
    return value?._id?.toString?.() ?? value?.toString?.() ?? '';
  }
}
