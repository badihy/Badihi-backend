import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseDocument } from './schemas/course.schema';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { Bookmark, BookmarkDocument } from '../bookmarks/schemas/bookmark.schema';
import { Slide, SlideDocument } from '../slides/schemas/slide.schema';
import { PopulateLevel } from './dto/course-query.dto';
import { BunnyService } from '../common/services/bunny.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(Slide.name) private slideModel: Model<SlideDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    private readonly bunnyService: BunnyService,
  ) { }

  async create(
    createCourseDto: CreateCourseDto,
    files: { coverImage: any[]; thumbnailImage: any[] },
  ): Promise<Course> {
    const { coverImage, thumbnailImage } = files;

    // Upload cover image if provided
    let coverImageUrl = createCourseDto.coverImage;
    if (coverImage && coverImage.length > 0 && coverImage[0]) {
      try {
        coverImageUrl = await this.bunnyService.uploadFile(coverImage[0]);
      } catch (error: any) {
        throw new Error(`فشل تحميل صورة الغلاف: ${error?.message || ''}`);
      }
    }

    // Upload thumbnail image if provided
    let thumbnailImageUrl = createCourseDto.thumbnailImage;
    if (thumbnailImage && thumbnailImage.length > 0 && thumbnailImage[0]) {
      try {
        thumbnailImageUrl = await this.bunnyService.uploadFile(thumbnailImage[0]);
      } catch (error: any) {
        // If cover was uploaded but thumbnail fails, delete the cover image
        if (coverImageUrl && coverImageUrl !== createCourseDto.coverImage) {
          try {
            await this.bunnyService.deleteFile(coverImageUrl);
          } catch (deleteError) {
            // Log but don't throw - we want to throw the original error
            console.error('فشل حذف صورة الغلاف بعد فشل تحميل الصورة المصغرة:', deleteError);
          }
        }
        throw new Error(`فشل تحميل الصورة المصغرة: ${error?.message || ''}`);
      }
    }

    // Create course with uploaded image URLs
    const courseData = {
      ...createCourseDto,
      coverImage: coverImageUrl,
      thumbnailImage: thumbnailImageUrl,
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
    let query = this.courseModel.find();
    
    // Filter by category if provided
    if (categoryId) {
      query = query.where('category').equals(categoryId);
    }

    // Populate category if requested
    if (includeCategory) {
      query = query.populate('category');
    }

    // Populate based on level
    switch (populateLevel) {
      case PopulateLevel.NONE:
        // No additional population
        break;
      case PopulateLevel.CHAPTERS:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
        });
        break;
      case PopulateLevel.LESSONS:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
          },
        });
        break;
      case PopulateLevel.SLIDES:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
            populate: {
              path: 'slides',
              options: { sort: { orderIndex: 1 } },
            },
          },
        });
        break;
      case PopulateLevel.QUIZZES:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'quiz',
          },
        });
        break;
      case PopulateLevel.FULL:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: [
            {
              path: 'lessons',
              options: { sort: { orderIndex: 1 } },
              populate: {
                path: 'slides',
                options: { sort: { orderIndex: 1 } },
              },
            },
            {
              path: 'quiz',
            },
          ],
        });
        break;
    }

    const courses = await query.exec();

    // Pre-compute enrollments count and average rating for all returned courses
    const courseIds = courses.map((c) => c._id).filter(Boolean);
    const statsMap = await this.getCourseStatsMap(courseIds);
    const reviewsMap = await this.getCourseReviewsMap(courseIds);
    const bookmarkedSet = await this.getBookmarkedCourseIdsSet(userId, courseIds);

    return this.mapCoursesResponse(courses, populateLevel, statsMap, bookmarkedSet, reviewsMap);
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
    let query = this.courseModel.findById(id);

    // Populate category if requested
    if (includeCategory) {
      query = query.populate('category');
    }

    // Populate based on level
    switch (populateLevel) {
      case PopulateLevel.NONE:
        break;
      case PopulateLevel.CHAPTERS:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
        });
        break;
      case PopulateLevel.LESSONS:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
          },
        });
        break;
      case PopulateLevel.SLIDES:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
            populate: {
              path: 'slides',
              options: { sort: { orderIndex: 1 } },
            },
          },
        });
        break;
      case PopulateLevel.QUIZZES:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'quiz',
          },
        });
        break;
      case PopulateLevel.FULL:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: [
            {
              path: 'lessons',
              options: { sort: { orderIndex: 1 } },
              populate: {
                path: 'slides',
                options: { sort: { orderIndex: 1 } },
              },
            },
            {
              path: 'quiz',
            },
          ],
        });
        break;
    }

    const course = await query.exec();
    if (!course) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${id} غير موجودة`);
    }

    // Get stats for this single course
    const statsMap = await this.getCourseStatsMap([course._id]);
    const stats = statsMap[course._id.toString()] ?? undefined;
    const reviewsMap = await this.getCourseReviewsMap([course._id]);
    const reviewsBundle = reviewsMap[course._id.toString()] ?? { reviews: [], reviewsCount: 0 };
    const bookmarkedSet = await this.getBookmarkedCourseIdsSet(userId, [course._id]);
    const isBookmarked = bookmarkedSet.has(course._id.toString());

    return this.mapCourseResponse(course, populateLevel, stats, isBookmarked, reviewsBundle);
  }

  private async getBookmarkedCourseIdsSet(userId: string | undefined, courseIds: any[]) {
    const set = new Set<string>();
    if (!userId || !courseIds || courseIds.length === 0) return set;

    const bookmarks = await this.bookmarkModel
      .find({ user: userId, course: { $in: courseIds } })
      .select('course')
      .lean()
      .exec();

    for (const b of bookmarks as any[]) {
      if (b?.course) set.add(b.course.toString());
    }

    return set;
  }

  /**
   * Build a map of courseId -> { enrollmentsCount, averageRating }
   */
  private async getCourseStatsMap(
    courseIds: any[],
  ): Promise<Record<string, { enrollmentsCount: number; averageRating: number | null }>> {
    if (!courseIds || courseIds.length === 0) {
      return {};
    }

    const aggregation = await this.enrollmentModel.aggregate([
      {
        $match: {
          course: { $in: courseIds },
        },
      },
      {
        $group: {
          _id: '$course',
          enrollmentsCount: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const statsMap: Record<string, { enrollmentsCount: number; averageRating: number | null }> = {};
    for (const item of aggregation) {
      const key = item._id.toString();
      statsMap[key] = {
        enrollmentsCount: item.enrollmentsCount ?? 0,
        averageRating: item.averageRating ?? null,
      };
    }

    return statsMap;
  }

  /**
   * شكل مراجعة واحدة كما في واجهة التقييمات (متسق مع enrollments.getCourseReviews).
   */
  private mapEnrollmentReviewToDto(r: any): any {
    return {
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
    };
  }

  /** مرشح التقييمات: يوجد تقييم رقمي أو تعليق غير فارغ (نفس منطق getCourseReviews). */
  private reviewMatchFilter() {
    return {
      $or: [
        { rating: { $exists: true, $ne: null } },
        { comment: { $exists: true, $nin: [null, ''] } },
      ],
    };
  }

  /**
   * تقييمات لعدة دورات دفعة واحدة: قائمة المراجعات + reviewsCount لكل دورة.
   */
  private async getCourseReviewsMap(
    courseIds: any[],
  ): Promise<Record<string, { reviews: any[]; reviewsCount: number }>> {
    if (!courseIds?.length) {
      return {};
    }

    const rows = await this.enrollmentModel
      .find({
        course: { $in: courseIds },
        ...this.reviewMatchFilter(),
      })
      .populate('user', 'fullName username email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const byCourse: Record<string, any[]> = {};
    for (const r of rows as any[]) {
      const cid = r.course?.toString?.() ?? String(r.course);
      if (!byCourse[cid]) {
        byCourse[cid] = [];
      }
      byCourse[cid].push(this.mapEnrollmentReviewToDto(r));
    }

    const out: Record<string, { reviews: any[]; reviewsCount: number }> = {};
    for (const id of courseIds) {
      const key = id?.toString?.() ?? String(id);
      const list = byCourse[key] ?? [];
      out[key] = { reviews: list, reviewsCount: list.length };
    }

    return out;
  }

  /**
   * Get course with chapters only
   */
  async findOneWithChapters(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.CHAPTERS);
  }

  /**
   * Get course with chapters and lessons
   */
  async findOneWithLessons(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.LESSONS);
  }

  /**
   * Get course with chapters, lessons, and slides
   */
  async findOneWithSlides(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.SLIDES);
  }

  /**
   * Get course with chapters and quizzes
   */
  async findOneWithQuizzes(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.QUIZZES);
  }

  /**
   * Get course with everything populated
   */
  async findOneFull(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.FULL);
  }

  /**
   * Map course response to clean structure
   */
  private mapCourseResponse(
    course: any,
    populateLevel: PopulateLevel,
    stats?: { enrollmentsCount?: number; averageRating?: number | null },
    isBookmarked?: boolean,
    reviewsBundle?: { reviews: any[]; reviewsCount: number },
  ): any {
    const mapped: any = {
      _id: course._id,
      name: course.name,
      description: course.description,
      shortDescription: course.shortDescription,
      price: course.price,
      estimationTime: course.estimationTime,
      coverImage: course.coverImage,
      thumbnailImage: course.thumbnailImage,
      willLearn: course.willLearn,
      requirements: course.requirements,
      targetAudience: course.targetAudience,
      level: course.level,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    // Attach aggregate stats if available
    mapped.enrollmentsCount = stats?.enrollmentsCount ?? 0;
    mapped.averageRating =
      typeof stats?.averageRating === 'number' ? Number(stats!.averageRating.toFixed(2)) : 0;
    mapped.isBookmarked = !!isBookmarked;

    mapped.reviewsCount = reviewsBundle?.reviewsCount ?? 0;
    mapped.reviews = reviewsBundle?.reviews ?? [];

    // Include category if populated
    if (course.category) {
      mapped.category = typeof course.category === 'object' ? {
        _id: course.category._id,
        name: course.category.name,
        description: course.category.description,
        image: course.category.image,
      } : course.category;
    }

    // Map chapters based on populate level
    if (course.chapters && Array.isArray(course.chapters)) {
      mapped.chapters = course.chapters.map((chapter: any) => this.mapChapterResponse(chapter, populateLevel));
    }

    return mapped;
  }

  /**
   * Map chapter response
   */
  private mapChapterResponse(chapter: any, populateLevel: PopulateLevel): any {
    const mapped: any = {
      _id: chapter._id,
      title: chapter.title,
      subtitle: chapter.subtitle,
      description: chapter.description,
      orderIndex: chapter.orderIndex,
      isCompleted: chapter.isCompleted,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };

    // Include lessons if populated or if level requires it
    if (chapter.lessons && Array.isArray(chapter.lessons) && chapter.lessons.length > 0) {
      // Check if lessons are populated (have title property) or just IDs
      if (chapter.lessons[0] && typeof chapter.lessons[0] === 'object' && chapter.lessons[0].title) {
        mapped.lessons = chapter.lessons.map((lesson: any) => this.mapLessonResponse(lesson, populateLevel));
      } else if (populateLevel === PopulateLevel.LESSONS || populateLevel === PopulateLevel.SLIDES || populateLevel === PopulateLevel.FULL) {
        // If we need lessons but they're not populated, return IDs
        mapped.lessonIds = chapter.lessons.map((lesson: any) => lesson._id || lesson);
      }
    }

    // Include quiz if populated
    if (chapter.quiz) {
      if (typeof chapter.quiz === 'object' && chapter.quiz.title) {
        mapped.quiz = this.mapQuizResponse(chapter.quiz);
      } else if (populateLevel === PopulateLevel.QUIZZES || populateLevel === PopulateLevel.FULL) {
        mapped.quizId = chapter.quiz._id || chapter.quiz;
      }
    }

    return mapped;
  }

  /**
   * Map lesson response
   */
  private mapLessonResponse(lesson: any, populateLevel: PopulateLevel): any {
    const mapped: any = {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      orderIndex: lesson.orderIndex,
      estimatedDuration: lesson.estimatedDuration,
      isCompleted: lesson.isCompleted,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };

    // Include slides if populated and level includes slides
    if ((populateLevel === PopulateLevel.SLIDES || populateLevel === PopulateLevel.FULL) && 
        lesson.slides && Array.isArray(lesson.slides)) {
      mapped.slides = lesson.slides.map((slide: any) => this.mapSlideResponse(slide));
    } else if (lesson.slides && Array.isArray(lesson.slides)) {
      // Just include slide IDs if not fully populated
      mapped.slideIds = lesson.slides.map((slide: any) => slide._id || slide);
    }

    return mapped;
  }

  /**
   * Map slide response
   */
  private mapSlideResponse(slide: any): any {
    return {
      _id: slide._id,
      title: slide.title,
      type: slide.type,
      textContent: slide.textContent,
      imageUrl: slide.imageUrl,
      orderIndex: slide.orderIndex,
      questions: slide.questions,
      questionHint: slide.questionHint,
      answer: slide.answer,
      isCompleted: slide.isCompleted,
      createdAt: slide.createdAt,
      updatedAt: slide.updatedAt,
    };
  }

  /**
   * Map quiz response
   */
  private mapQuizResponse(quiz: any): any {
    // Sort questions by orderIndex if they exist
    const questions = quiz.questions && Array.isArray(quiz.questions)
      ? [...quiz.questions].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))
      : quiz.questions;

    return {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      questions: questions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      isCompleted: quiz.isCompleted,
      score: quiz.score,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };
  }

  /**
   * Map multiple courses response
   */
  private mapCoursesResponse(
    courses: any[],
    populateLevel: PopulateLevel,
    statsMap?: Record<
      string,
      {
        enrollmentsCount?: number;
        averageRating?: number | null;
      }
    >,
    bookmarkedSet?: Set<string>,
    reviewsMap?: Record<string, { reviews: any[]; reviewsCount: number }>,
  ): any[] {
    return courses.map((course) => {
      const key = course._id?.toString?.() ?? '';
      const stats = statsMap ? statsMap[key] : undefined;
      const isBookmarked = bookmarkedSet ? bookmarkedSet.has(key) : false;
      const reviewsBundle = reviewsMap ? reviewsMap[key] : undefined;
      return this.mapCourseResponse(course, populateLevel, stats, isBookmarked, reviewsBundle);
    });
  }

  async update(
    id: string, 
    updateCourseDto: UpdateCourseDto, 
    files?: { cover?: any[]; thumbnail?: any[] }
  ): Promise<Course> {
    // Get existing course to check for old images
    const existingCourse = await this.courseModel.findById(id).exec();
    if (!existingCourse) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${id} غير موجودة`);
    }

    const updateData: any = { ...updateCourseDto };

    // Handle cover image upload
    if (files?.cover && files.cover.length > 0 && files.cover[0]) {
      try {
        // Upload new cover image
        const newCoverUrl = await this.bunnyService.uploadFile(files.cover[0]);
        updateData.coverImage = newCoverUrl;

        // Delete old cover image if it exists and is different
        if (existingCourse.coverImage && 
            existingCourse.coverImage !== updateCourseDto.coverImage &&
            existingCourse.coverImage.startsWith('https://')) {
          try {
            await this.bunnyService.deleteFile(existingCourse.coverImage);
          } catch (deleteError) {
            // Log but don't throw - we've already uploaded the new image
            console.error('فشل حذف صورة الغلاف القديمة:', deleteError);
          }
        }
      } catch (error: any) {
        throw new Error(`فشل تحميل صورة الغلاف: ${error?.message || ''}`);
      }
    }

    // Handle thumbnail image upload
    if (files?.thumbnail && files.thumbnail.length > 0 && files.thumbnail[0]) {
      try {
        // Upload new thumbnail image
        const newThumbnailUrl = await this.bunnyService.uploadFile(files.thumbnail[0]);
        updateData.thumbnailImage = newThumbnailUrl;

        // Delete old thumbnail image if it exists and is different
        if (existingCourse.thumbnailImage && 
            existingCourse.thumbnailImage !== updateCourseDto.thumbnailImage &&
            existingCourse.thumbnailImage.startsWith('https://')) {
          try {
            await this.bunnyService.deleteFile(existingCourse.thumbnailImage);
          } catch (deleteError) {
            // Log but don't throw - we've already uploaded the new image
            console.error('فشل حذف الصورة المصغرة القديمة:', deleteError);
          }
        }
      } catch (error: any) {
        // If cover was uploaded but thumbnail fails, try to clean up
        if (updateData.coverImage && updateData.coverImage !== existingCourse.coverImage) {
          try {
            await this.bunnyService.deleteFile(updateData.coverImage);
          } catch (cleanupError) {
            console.error('فشل تنظيف صورة الغلاف بعد فشل تحميل الصورة المصغرة:', cleanupError);
          }
        }
        throw new Error(`فشل تحميل الصورة المصغرة: ${error?.message || ''}`);
      }
    }

    const updatedCourse = await this.courseModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
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

    // Delete images from BunnyCDN if they exist
    const deletePromises: Promise<void>[] = [];
    
    if (courseToDelete.coverImage && courseToDelete.coverImage.startsWith('https://')) {
      deletePromises.push(
          this.bunnyService.deleteFile(courseToDelete.coverImage).catch(error => {
          console.error(`فشل حذف صورة الغلاف: ${courseToDelete.coverImage}`, error);
        })
      );
    }

    if (courseToDelete.thumbnailImage && courseToDelete.thumbnailImage.startsWith('https://')) {
      deletePromises.push(
        this.bunnyService.deleteFile(courseToDelete.thumbnailImage).catch(error => {
          console.error(`فشل حذف الصورة المصغرة: ${courseToDelete.thumbnailImage}`, error);
        })
      );
    }

    // Wait for image deletions (don't fail if deletion fails)
    await Promise.allSettled(deletePromises);

    // Delete the course
    const deletedCourse = await this.courseModel.findByIdAndDelete(id).exec();
    return deletedCourse!;
  }

  async findEnrolledCourses(
    userId: string,
    options: { page: number; limit: number; search?: string; filter?: string },
  ): Promise<{ courses: Course[]; total: number }> {
    const { page, limit, search, filter } = options;

    const query: any = { 'enrollments.userId': userId };

    // Apply search filter
    if (search) {
      query.title = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Apply additional filters
    if (filter) {
      query.category = filter; // Example: filter by category
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await this.courseModel.countDocuments(query);
    const courses = await this.courseModel.find(query).skip(skip).limit(limit).exec();

    return { courses, total };
  }
}