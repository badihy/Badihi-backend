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

    return this.courseResponseMapperService.mapCoursesResponse(
      courses,
      populateLevel,
      statsMap,
      bookmarkedSet,
      reviewsMap,
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

    return this.courseResponseMapperService.mapCourseResponse(
      course,
      populateLevel,
      stats,
      isBookmarked,
      reviewsBundle,
    );
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
      .select('course lastAccessedAt enrolledAt')
      .sort({ lastAccessedAt: -1, enrolledAt: -1, createdAt: -1 })
      .lean()
      .exec();

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

    return {
      courses: this.courseResponseMapperService.mapCoursesResponse(
        courses,
        PopulateLevel.NONE,
        statsMap,
        bookmarkedSet,
        reviewsMap,
      ),
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages: Math.ceil(total / normalizedLimit),
    };
  }
}
