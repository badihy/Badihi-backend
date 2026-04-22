import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Course, CourseDocument } from './schemas/course.schema';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { UserService } from '../user/user.service';

export type CourseProgressAccess = {
  completedLessonIds: Set<string>;
  completedQuizIds: Set<string>;
};

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  /**
   * Enroll a user in a course
   */
  async enroll(courseId: string, userId: string): Promise<Enrollment> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(
        `الدورة التدريبية بالمعرف ${courseId} غير موجودة`,
      );
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentModel
      .findOne({ course: courseId, user: userId })
      .exec();
    if (existingEnrollment) {
      throw new BadRequestException('المستخدم مسجل بالفعل في هذه الدورة');
    }

    const enrollment = new this.enrollmentModel({
      course: courseId,
      user: userId,
      progress: 0,
      completedLessons: [],
      completedQuizzes: [],
    });

    const savedEnrollment = await enrollment.save();

    // Add course to user's enrolledCourses array
    try {
      await this.userService.enrollInCourse(userId, courseId);
    } catch (error) {
      console.error('Failed to update user enrolledCourses:', error);
    }

    return savedEnrollment;
  }

  /**
   * Get user enrollment for a course
   */
  async getEnrollment(courseId: string, userId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findOne({ course: courseId, user: userId })
      .exec();
    if (!enrollment) {
      throw new NotFoundException('تسجيل الدورة غير موجود للمستخدم المذكور');
    }

    // Update lastAccessedAt
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    return enrollment;
  }

  /**
   * Add or update a review (rating & comment) for a course enrollment
   */
  async addOrUpdateReview(
    courseId: string,
    userId: string,
    rating: number,
    comment?: string,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findOne({ course: courseId, user: userId })
      .exec();
    if (!enrollment) {
      throw new NotFoundException('المستخدم غير مسجل في هذه الدورة');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('التقييم يجب أن يكون رقماً بين 1 و 5');
    }

    enrollment.rating = rating;
    if (typeof comment === 'string') {
      enrollment.comment = comment;
    }
    enrollment.lastAccessedAt = new Date();

    return enrollment.save();
  }

  /**
   * Get all reviews for a course (with basic user info)
   */
  async getCourseReviews(courseId: string): Promise<any[]> {
    const reviews = await this.enrollmentModel
      .find({
        course: courseId,
        $or: [
          { rating: { $exists: true } },
          { comment: { $exists: true, $ne: '' } },
        ],
      })
      .populate('user', 'fullName username email')
      .sort({ createdAt: -1 })
      .exec();

    return reviews.map((r: any) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.user
        ? {
            _id: r.user._id,
            fullName: r.user.fullName,
            username: r.user.username,
            email: r.user.email,
          }
        : null,
    }));
  }

  /**
   * Mark a lesson as completed to update progress
   */
  async markLessonCompleted(
    courseId: string,
    userId: string,
    lessonId: string,
  ): Promise<Enrollment> {
    await this.assertLessonAccessible(courseId, userId, lessonId);
    return this.updateEnrollmentProgress(courseId, userId, { lessonId });
  }

  /**
   * Mark a quiz as completed to update progress
   */
  async markQuizCompleted(
    courseId: string,
    userId: string,
    quizId: string,
  ): Promise<Enrollment> {
    await this.assertQuizAccessible(courseId, userId, quizId);
    return this.updateEnrollmentProgress(courseId, userId, { quizId });
  }

  async getCourseProgressAccess(
    courseId: string,
    userId?: string,
  ): Promise<CourseProgressAccess | undefined> {
    if (!userId) {
      return undefined;
    }

    const enrollment = await this.enrollmentModel
      .findOne({ course: courseId, user: userId })
      .select('completedLessons completedQuizzes')
      .exec();

    if (!enrollment) {
      return undefined;
    }

    return this.mapEnrollmentToAccess(enrollment);
  }

  async getCoursesProgressAccessMap(
    courseIds: any[],
    userId?: string,
  ): Promise<Record<string, CourseProgressAccess | undefined>> {
    const result: Record<string, CourseProgressAccess | undefined> = {};
    const normalizedCourseIds = courseIds
      .map((courseId) => this.toIdString(courseId))
      .filter(Boolean);

    for (const courseId of normalizedCourseIds) {
      result[courseId] = undefined;
    }

    if (!userId || normalizedCourseIds.length === 0) {
      return result;
    }

    const enrollments = await this.enrollmentModel
      .find({ course: { $in: normalizedCourseIds }, user: userId })
      .select('course completedLessons completedQuizzes')
      .exec();

    for (const enrollment of enrollments) {
      const courseId = this.toIdString(enrollment.course);
      if (courseId) {
        result[courseId] = this.mapEnrollmentToAccess(enrollment);
      }
    }

    return result;
  }

  async assertChapterAccessibleById(
    userId: string,
    chapterId: string,
  ): Promise<void> {
    const chapter = await this.chapterModel.findById(chapterId).exec();
    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${chapterId} غير موجود`);
    }

    await this.assertChapterAccessible(
      this.toIdString(chapter.course),
      userId,
      chapterId,
    );
  }

  async assertLessonAccessibleById(
    userId: string,
    lessonId: string,
  ): Promise<void> {
    const lesson = await this.lessonModel.findById(lessonId).exec();
    if (!lesson) {
      throw new NotFoundException(`الدرس بالمعرف ${lessonId} غير موجود`);
    }

    const chapter = await this.chapterModel.findById(lesson.chapter).exec();
    if (!chapter) {
      throw new NotFoundException('الفصل المرتبط بهذا الدرس غير موجود');
    }

    await this.assertLessonAccessible(
      this.toIdString(chapter.course),
      userId,
      lessonId,
    );
  }

  async assertQuizAccessibleById(
    userId: string,
    quizId: string,
  ): Promise<void> {
    const quiz = await this.quizModel.findById(quizId).exec();
    if (!quiz) {
      throw new NotFoundException(`الاختبار بالمعرف ${quizId} غير موجود`);
    }

    const chapter = await this.chapterModel.findById(quiz.chapter).exec();
    if (!chapter) {
      throw new NotFoundException('الفصل المرتبط بهذا الاختبار غير موجود');
    }

    await this.assertQuizAccessible(
      this.toIdString(chapter.course),
      userId,
      quizId,
    );
  }

  async assertChapterAccessible(
    courseId: string,
    userId: string,
    chapterId: string,
  ): Promise<void> {
    const enrollment = await this.findEnrollmentOrThrow(courseId, userId);
    const chapters = await this.getCourseChaptersForProgress(courseId);
    const targetIndex = chapters.findIndex((chapter: any) =>
      this.idsEqual(chapter._id, chapterId),
    );

    if (targetIndex === -1) {
      throw new NotFoundException(`الفصل بالمعرف ${chapterId} غير موجود`);
    }

    const access = this.mapEnrollmentToAccess(enrollment);
    const targetChapter = chapters[targetIndex];
    if (targetChapter.isLocked) {
      throw new ForbiddenException('هذا الفصل مقفول حالياً');
    }

    for (const chapter of chapters.slice(0, targetIndex)) {
      if (chapter.isLocked || !this.isChapterCompleted(chapter, access)) {
        throw new ForbiddenException(
          'يجب إكمال الفصل السابق قبل فتح هذا الفصل',
        );
      }
    }
  }

  async assertLessonAccessible(
    courseId: string,
    userId: string,
    lessonId: string,
  ): Promise<void> {
    const enrollment = await this.findEnrollmentOrThrow(courseId, userId);
    const chapters = await this.getCourseChaptersForProgress(courseId);
    const access = this.mapEnrollmentToAccess(enrollment);

    for (const chapter of chapters) {
      const lessons = this.getChapterLessons(chapter);
      const lessonIndex = lessons.findIndex((lesson: any) =>
        this.idsEqual(lesson._id, lessonId),
      );

      if (lessonIndex === -1) {
        if (chapter.isLocked || !this.isChapterCompleted(chapter, access)) {
          throw new ForbiddenException(
            'يجب إكمال الفصل السابق قبل فتح هذا الدرس',
          );
        }
        continue;
      }

      if (chapter.isLocked) {
        throw new ForbiddenException('هذا الفصل مقفول حالياً');
      }

      if (lessons[lessonIndex].isLocked) {
        throw new ForbiddenException('هذا الدرس مقفول حالياً');
      }

      for (const previousLesson of lessons.slice(0, lessonIndex)) {
        if (
          previousLesson.isLocked ||
          !access.completedLessonIds.has(this.toIdString(previousLesson._id))
        ) {
          throw new ForbiddenException(
            'يجب إكمال الدرس السابق قبل فتح هذا الدرس',
          );
        }
      }

      return;
    }

    throw new NotFoundException(`الدرس بالمعرف ${lessonId} غير موجود`);
  }

  async assertQuizAccessible(
    courseId: string,
    userId: string,
    quizId: string,
  ): Promise<void> {
    const enrollment = await this.findEnrollmentOrThrow(courseId, userId);
    const chapters = await this.getCourseChaptersForProgress(courseId);
    const access = this.mapEnrollmentToAccess(enrollment);

    for (const chapter of chapters) {
      if (chapter.quiz && this.idsEqual(this.getItemId(chapter.quiz), quizId)) {
        if (chapter.isLocked) {
          throw new ForbiddenException('هذا الفصل مقفول حالياً');
        }

        return;
      }

      if (chapter.isLocked || !this.isChapterCompleted(chapter, access)) {
        throw new ForbiddenException(
          'يجب إكمال الفصل السابق قبل فتح هذا الاختبار',
        );
      }
    }

    throw new NotFoundException(`الاختبار بالمعرف ${quizId} غير موجود`);
  }

  /**
   * Central method to update progress
   */
  private async updateEnrollmentProgress(
    courseId: string,
    userId: string,
    completedItems: { lessonId?: string; quizId?: string },
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findOne({ course: courseId, user: userId })
      .exec();
    if (!enrollment) {
      throw new NotFoundException('التسجيل غير موجود');
    }

    let isUpdated = false;
    const completedLessonIds = new Set(
      enrollment.completedLessons.map((lessonId) => this.toIdString(lessonId)),
    );
    const completedQuizIds = new Set(
      enrollment.completedQuizzes.map((quizId) => this.toIdString(quizId)),
    );

    if (
      completedItems.lessonId &&
      !completedLessonIds.has(completedItems.lessonId)
    ) {
      enrollment.completedLessons.push(completedItems.lessonId as any);
      isUpdated = true;
    }

    if (completedItems.quizId && !completedQuizIds.has(completedItems.quizId)) {
      enrollment.completedQuizzes.push(completedItems.quizId as any);
      isUpdated = true;
    }

    if (isUpdated) {
      // Calculate new progress
      const chapters = await this.chapterModel
        .find({ course: courseId })
        .exec();

      let totalItems = 0;
      for (const chapter of chapters) {
        // add total lessons in the chapter
        if (chapter.lessons && chapter.lessons.length > 0) {
          totalItems += chapter.lessons.length;
        }
        // add 1 if there is a quiz
        if (chapter.quiz) {
          totalItems += 1;
        }
      }

      if (totalItems > 0) {
        const completedCount =
          enrollment.completedLessons.length +
          enrollment.completedQuizzes.length;
        const progressPercentage = Math.round(
          (completedCount / totalItems) * 100,
        );
        enrollment.progress = Math.min(progressPercentage, 100);

        if (enrollment.progress === 100) {
          enrollment.isCompleted = true;
        }
      }

      return enrollment.save();
    }

    return enrollment;
  }

  private async findEnrollmentOrThrow(
    courseId: string,
    userId: string,
  ): Promise<EnrollmentDocument> {
    const enrollment = await this.enrollmentModel
      .findOne({ course: courseId, user: userId })
      .exec();
    if (!enrollment) {
      throw new ForbiddenException('يجب التسجيل في الدورة أولاً');
    }

    return enrollment;
  }

  private async getCourseChaptersForProgress(courseId: string): Promise<any[]> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(
        `الدورة التدريبية بالمعرف ${courseId} غير موجودة`,
      );
    }

    return this.chapterModel
      .find({ course: courseId })
      .sort({ orderIndex: 1 })
      .populate({ path: 'lessons', options: { sort: { orderIndex: 1 } } })
      .populate('quiz')
      .exec();
  }

  private mapEnrollmentToAccess(enrollment: Enrollment): CourseProgressAccess {
    return {
      completedLessonIds: new Set(
        (enrollment.completedLessons ?? []).map((lessonId) =>
          this.toIdString(lessonId),
        ),
      ),
      completedQuizIds: new Set(
        (enrollment.completedQuizzes ?? []).map((quizId) =>
          this.toIdString(quizId),
        ),
      ),
    };
  }

  private isChapterCompleted(
    chapter: any,
    access: CourseProgressAccess,
  ): boolean {
    const lessons = this.getChapterLessons(chapter);
    if (lessons.length > 0) {
      return lessons.every((lesson: any) =>
        access.completedLessonIds.has(this.toIdString(lesson._id)),
      );
    }

    if (chapter.quiz) {
      return access.completedQuizIds.has(
        this.toIdString(this.getItemId(chapter.quiz)),
      );
    }

    return true;
  }

  private getChapterLessons(chapter: any): any[] {
    return Array.isArray(chapter.lessons) ? chapter.lessons : [];
  }

  private idsEqual(left: any, right: any): boolean {
    return this.toIdString(left) === this.toIdString(right);
  }

  private getItemId(item: any): any {
    return item?._id ?? item;
  }

  private toIdString(value: any): string {
    return value?._id?.toString?.() ?? value?.toString?.() ?? '';
  }
}
