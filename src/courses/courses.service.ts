import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseDocument } from './schemas/course.schema';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { PopulateLevel } from './dto/course-query.dto';
import { CourseMediaService } from './course-media.service';
import { CourseStatsService } from './course-stats.service';
import { CourseResponseMapperService } from './course-response-mapper.service';
import { CourseQueryService } from './course-query.service';
import { EnrollmentsService } from './enrollments.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    private readonly courseMediaService: CourseMediaService,
    private readonly courseStatsService: CourseStatsService,
    private readonly courseResponseMapperService: CourseResponseMapperService,
    private readonly courseQueryService: CourseQueryService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    files: { coverImage: any[]; thumbnailImage: any[] },
  ): Promise<Course> {
    const media = await this.courseMediaService.prepareCreateMedia(
      createCourseDto,
      files,
    );

    // Create course with uploaded image URLs
    const courseData = {
      ...createCourseDto,
      ...media,
    };

    const createdCourse = new this.courseModel(courseData);
    return createdCourse.save();
  }

  /**
   * Get all courses with flexible population
   * @param populateLevel - Level of nested population
   * @param includeCategory - Whether to include category
   * @param categoryId - Optional category ID to filter by
   */
  async findAll(
    populateLevel: PopulateLevel = PopulateLevel.CHAPTERS,
    includeCategory: boolean = true,
    categoryId?: string,
    userId?: string,
  ): Promise<any[]> {
    const query = this.courseQueryService.buildFindAllQuery(
      this.courseModel,
      populateLevel,
      includeCategory,
      categoryId,
    );

    const courses = await query.exec();

    // Pre-compute enrollments count and average rating for all returned courses
    const courseIds = courses.map((c) => c._id).filter(Boolean);
    const statsMap = await this.courseStatsService.getCourseStatsMap(courseIds);
    const reviewsMap =
      await this.courseStatsService.getCourseReviewsMap(courseIds);
    const bookmarkedSet =
      await this.courseStatsService.getBookmarkedCourseIdsSet(
        userId,
        courseIds,
      );
    const accessMap = await this.enrollmentsService.getCoursesProgressAccessMap(
      courseIds,
      userId,
    );

    return this.courseResponseMapperService.mapCoursesResponse(
      courses,
      populateLevel,
      statsMap,
      bookmarkedSet,
      reviewsMap,
      accessMap,
    );
  }

  /**
   * Get a single course by ID with flexible population
   */
  async findOne(
    id: string,
    populateLevel: PopulateLevel = PopulateLevel.FULL,
    includeCategory: boolean = true,
    userId?: string,
  ): Promise<any> {
    const query = this.courseQueryService.buildFindOneQuery(
      this.courseModel,
      id,
      populateLevel,
      includeCategory,
    );

    const course = await query.exec();
    if (!course) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${id} غير موجودة`);
    }

    // Get stats for this single course
    const statsMap = await this.courseStatsService.getCourseStatsMap([
      course._id,
    ]);
    const stats = statsMap[course._id.toString()] ?? undefined;
    const reviewsMap = await this.courseStatsService.getCourseReviewsMap([
      course._id,
    ]);
    const reviewsBundle = reviewsMap[course._id.toString()] ?? {
      reviews: [],
      reviewsCount: 0,
    };
    const bookmarkedSet =
      await this.courseStatsService.getBookmarkedCourseIdsSet(userId, [
        course._id,
      ]);
    const isBookmarked = bookmarkedSet.has(course._id.toString());
    const access = await this.enrollmentsService.getCourseProgressAccess(
      course._id.toString(),
      userId,
    );

    return this.courseResponseMapperService.mapCourseResponse(
      course,
      populateLevel,
      stats,
      isBookmarked,
      reviewsBundle,
      access,
    );
  }

  /**
   * Get course with chapters only
   */
  async findOneWithChapters(id: string, userId?: string): Promise<any> {
    return this.findOne(id, PopulateLevel.CHAPTERS, true, userId);
  }

  /**
   * Get course with chapters and lessons
   */
  async findOneWithLessons(id: string, userId?: string): Promise<any> {
    return this.findOne(id, PopulateLevel.LESSONS, true, userId);
  }

  /**
   * Get course with chapters, lessons, and slides
   */
  async findOneWithSlides(id: string, userId?: string): Promise<any> {
    return this.findOne(id, PopulateLevel.SLIDES, true, userId);
  }

  /**
   * Get course with chapters and quizzes
   */
  async findOneWithQuizzes(id: string, userId?: string): Promise<any> {
    return this.findOne(id, PopulateLevel.QUIZZES, true, userId);
  }

  /**
   * Get course with everything populated
   */
  async findOneFull(id: string, userId?: string): Promise<any> {
    return this.findOne(id, PopulateLevel.FULL, true, userId);
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    files?: { cover?: any[]; thumbnail?: any[] },
  ): Promise<Course> {
    // Get existing course to check for old images
    const existingCourse = await this.courseModel.findById(id).exec();
    if (!existingCourse) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${id} غير موجودة`);
    }

    const updateData = await this.courseMediaService.prepareUpdateMedia(
      existingCourse,
      updateCourseDto,
      files,
    );

    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedCourse) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${id} غير موجودة`);
    }
    return updatedCourse;
  }

  async remove(id: string): Promise<Course> {
    const courseToDelete = await this.courseModel.findById(id).exec();
    if (!courseToDelete) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${id} غير موجودة`);
    }

    await this.courseMediaService.cleanupCourseMedia(courseToDelete);

    // Delete the course
    const deletedCourse = await this.courseModel.findByIdAndDelete(id).exec();
    return deletedCourse!;
  }

  async findEnrolledCourses(
    userId: string,
    options: { page: number; limit: number; search?: string; filter?: string },
  ): Promise<{
    courses: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, search, filter } = options;
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (normalizedPage - 1) * normalizedLimit;

    const enrollments = await this.enrollmentModel
      .find({ user: userId })
      .select(
        'course completedLessons completedQuizzes progress isCompleted lastAccessedAt enrolledAt',
      )
      .sort({ lastAccessedAt: -1, enrolledAt: -1, createdAt: -1 })
      .lean()
      .exec();
    const enrollmentByCourseId = new Map(
      enrollments.map((enrollment: any) => [
        this.toIdString(enrollment.course),
        enrollment,
      ]),
    );

    const orderedCourseIds = Array.from(
      new Set(
        enrollments
          .map(
            (enrollment: any) =>
              enrollment?.course?.toString?.() ?? String(enrollment?.course),
          )
          .filter(Boolean),
      ),
    );

    if (orderedCourseIds.length === 0) {
      return {
        courses: [],
        total: 0,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: 0,
      };
    }

    const courseFilter: any = { _id: { $in: orderedCourseIds } };
    if (search) {
      courseFilter.name = { $regex: search, $options: 'i' };
    }
    if (filter) {
      courseFilter.category = filter;
    }

    const matchingCourses = await this.courseModel
      .find(courseFilter)
      .select('_id')
      .lean()
      .exec();
    const matchingCourseIds = new Set(
      matchingCourses.map((course: any) => course._id.toString()),
    );

    const filteredOrderedCourseIds = orderedCourseIds.filter((id) =>
      matchingCourseIds.has(id),
    );
    const total = filteredOrderedCourseIds.length;
    const pagedCourseIds = filteredOrderedCourseIds.slice(
      skip,
      skip + normalizedLimit,
    );

    if (pagedCourseIds.length === 0) {
      return {
        courses: [],
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: Math.ceil(total / normalizedLimit),
      };
    }

    const courses = await this.courseModel
      .find({ _id: { $in: pagedCourseIds } })
      .populate('category')
      .exec();
    const courseLearningStates = await this.courseModel
      .find({ _id: { $in: pagedCourseIds } })
      .select('_id estimationTime chapters')
      .populate({
        path: 'chapters',
        select:
          'title subtitle description orderIndex lessons quiz isCompleted isLocked',
        options: { sort: { orderIndex: 1 } },
        populate: [
          {
            path: 'lessons',
            select:
              'title description orderIndex estimatedDuration isCompleted isLocked',
            options: { sort: { orderIndex: 1 } },
          },
          {
            path: 'quiz',
            select:
              'title description timeLimit passingScore isCompleted score',
          },
        ],
      })
      .lean()
      .exec();
    const enrolledCourseStateMap = this.buildEnrolledCourseStateMap(
      courseLearningStates,
      enrollmentByCourseId,
    );

    const ordering = new Map(pagedCourseIds.map((id, index) => [id, index]));
    courses.sort(
      (left: any, right: any) =>
        (ordering.get(left._id.toString()) ?? 0) -
        (ordering.get(right._id.toString()) ?? 0),
    );

    const statsMap = await this.courseStatsService.getCourseStatsMap(
      courses.map((course) => course._id),
    );
    const reviewsMap = await this.courseStatsService.getCourseReviewsMap(
      courses.map((course) => course._id),
    );
    const bookmarkedSet =
      await this.courseStatsService.getBookmarkedCourseIdsSet(
        userId,
        courses.map((course) => course._id),
      );

    const mappedCourses = this.courseResponseMapperService.mapCoursesResponse(
      courses,
      PopulateLevel.NONE,
      statsMap,
      bookmarkedSet,
      reviewsMap,
    );

    return {
      courses: mappedCourses.map((course) => ({
        ...course,
        ...(enrolledCourseStateMap[this.toIdString(course._id)] ?? {}),
      })),
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages: Math.ceil(total / normalizedLimit),
    };
  }

  private buildEnrolledCourseStateMap(
    courses: any[],
    enrollmentByCourseId: Map<string, any>,
  ): Record<string, any> {
    return courses.reduce((stateMap: Record<string, any>, course: any) => {
      const courseId = this.toIdString(course._id);
      const enrollment = enrollmentByCourseId.get(courseId);
      stateMap[courseId] = this.buildEnrolledCourseState(course, enrollment);
      return stateMap;
    }, {});
  }

  private buildEnrolledCourseState(course: any, enrollment: any): any {
    const progress = Math.min(
      Math.max(Number(enrollment?.progress) || 0, 0),
      100,
    );
    const completedLessonIds = new Set<string>(
      (enrollment?.completedLessons ?? []).map((lessonId: any) =>
        this.toIdString(lessonId),
      ),
    );
    const completedQuizIds = new Set<string>(
      (enrollment?.completedQuizzes ?? []).map((quizId: any) =>
        this.toIdString(quizId),
      ),
    );
    const chapters = this.sortByOrderIndex(course?.chapters ?? []);
    const openState = this.findLastOpenLearningState(
      chapters,
      completedLessonIds,
      completedQuizIds,
    );
    const remainingMinutes = this.calculateRemainingMinutes(
      course,
      progress,
      completedLessonIds,
      completedQuizIds,
    );

    return {
      progress,
      isCompleted: !!enrollment?.isCompleted || progress === 100,
      lastOpenChapter: openState.chapter,
      lastOpenLesson: openState.lesson,
      remainingHours: Number((remainingMinutes / 60).toFixed(2)),
      remainingMinutes,
    };
  }

  private findLastOpenLearningState(
    chapters: any[],
    completedLessonIds: Set<string>,
    completedQuizIds: Set<string>,
  ): { chapter: any; lesson: any } {
    let lastOpenChapter: any = null;
    let lastOpenLesson: any = null;

    for (const chapter of chapters) {
      if (chapter?.isLocked) {
        break;
      }

      lastOpenChapter = this.mapOpenChapter(
        chapter,
        completedLessonIds,
        completedQuizIds,
      );
      lastOpenLesson = this.findLastOpenLesson(chapter, completedLessonIds);

      if (
        !this.isChapterCompletedForEnrollment(
          chapter,
          completedLessonIds,
          completedQuizIds,
        )
      ) {
        break;
      }
    }

    return { chapter: lastOpenChapter, lesson: lastOpenLesson };
  }

  private findLastOpenLesson(
    chapter: any,
    completedLessonIds: Set<string>,
  ): any {
    const lessons = this.sortByOrderIndex(chapter?.lessons ?? []);
    let lastOpenLesson: any = null;

    for (const lesson of lessons) {
      if (lesson?.isLocked) {
        break;
      }

      const lessonId = this.toIdString(lesson._id);
      lastOpenLesson = this.mapOpenLesson(lesson, completedLessonIds);

      if (!completedLessonIds.has(lessonId)) {
        break;
      }
    }

    return lastOpenLesson;
  }

  private calculateRemainingMinutes(
    course: any,
    progress: number,
    completedLessonIds: Set<string>,
    completedQuizIds: Set<string>,
  ): number {
    const courseHours = this.parseHours(course?.estimationTime);
    if (courseHours > 0) {
      return Math.max(
        0,
        Math.round(courseHours * 60 * ((100 - progress) / 100)),
      );
    }

    return this.calculateRemainingContentMinutes(
      course?.chapters ?? [],
      completedLessonIds,
      completedQuizIds,
    );
  }

  private calculateRemainingContentMinutes(
    chapters: any[],
    completedLessonIds: Set<string>,
    completedQuizIds: Set<string>,
  ): number {
    return this.sortByOrderIndex(chapters).reduce((total, chapter: any) => {
      const lessonsMinutes = this.sortByOrderIndex(
        chapter?.lessons ?? [],
      ).reduce((sum, lesson: any) => {
        const lessonId = this.toIdString(lesson._id);
        if (completedLessonIds.has(lessonId)) {
          return sum;
        }

        return sum + Math.max(0, Number(lesson.estimatedDuration) || 0);
      }, 0);

      const quizId = this.toIdString(chapter?.quiz?._id ?? chapter?.quiz);
      const quizMinutes =
        chapter?.quiz && !completedQuizIds.has(quizId)
          ? Math.max(0, Number(chapter.quiz.timeLimit) || 0)
          : 0;

      return total + lessonsMinutes + quizMinutes;
    }, 0);
  }

  private isChapterCompletedForEnrollment(
    chapter: any,
    completedLessonIds: Set<string>,
    completedQuizIds: Set<string>,
  ): boolean {
    const lessons = this.sortByOrderIndex(chapter?.lessons ?? []);
    if (lessons.length > 0) {
      return lessons.every((lesson: any) =>
        completedLessonIds.has(this.toIdString(lesson._id)),
      );
    }

    if (chapter?.quiz) {
      return completedQuizIds.has(
        this.toIdString(chapter.quiz._id ?? chapter.quiz),
      );
    }

    return true;
  }

  private mapOpenChapter(
    chapter: any,
    completedLessonIds: Set<string>,
    completedQuizIds: Set<string>,
  ): any {
    if (!chapter) {
      return null;
    }

    const quizId = this.toIdString(chapter.quiz?._id ?? chapter.quiz);
    return {
      _id: chapter._id,
      title: chapter.title,
      subtitle: chapter.subtitle,
      description: chapter.description,
      orderIndex: chapter.orderIndex,
      isCompleted: this.isChapterCompletedForEnrollment(
        chapter,
        completedLessonIds,
        completedQuizIds,
      ),
      isLocked: !!chapter.isLocked,
    };
  }

  private mapOpenLesson(lesson: any, completedLessonIds: Set<string>): any {
    if (!lesson) {
      return null;
    }

    const lessonId = this.toIdString(lesson._id);
    return {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      orderIndex: lesson.orderIndex,
      estimatedDuration: lesson.estimatedDuration,
      isCompleted: completedLessonIds.has(lessonId),
      isLocked: !!lesson.isLocked,
    };
  }

  private parseHours(value?: string): number {
    if (!value) {
      return 0;
    }

    const match = value.match(/(\d+(?:\.\d+)?)/);
    if (!match) {
      return 0;
    }

    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) {
      return 0;
    }

    return /min|minute|دقيقة|دقايق/i.test(value) ? amount / 60 : amount;
  }

  private sortByOrderIndex(items: any[]): any[] {
    return [...items].sort(
      (left: any, right: any) =>
        (Number(left?.orderIndex) || 0) - (Number(right?.orderIndex) || 0),
    );
  }

  private toIdString(value: any): string {
    return value?._id?.toString?.() ?? value?.toString?.() ?? '';
  }
}
