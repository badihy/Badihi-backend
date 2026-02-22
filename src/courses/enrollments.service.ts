import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Course, CourseDocument } from './schemas/course.schema';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  /**
   * Enroll a user in a course
   */
  async enroll(courseId: string, userId: string): Promise<Enrollment> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${courseId} غير موجودة`);
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentModel.findOne({ course: courseId, user: userId }).exec();
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
    const enrollment = await this.enrollmentModel.findOne({ course: courseId, user: userId }).exec();
    if (!enrollment) {
      throw new NotFoundException('تسجيل الدورة غير موجود للمستخدم المذكور');
    }
    
    // Update lastAccessedAt
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();
    
    return enrollment;
  }

  /**
   * Mark a lesson as completed to update progress
   */
  async markLessonCompleted(courseId: string, userId: string, lessonId: string): Promise<Enrollment> {
    return this.updateEnrollmentProgress(courseId, userId, { lessonId });
  }

  /**
   * Mark a quiz as completed to update progress
   */
  async markQuizCompleted(courseId: string, userId: string, quizId: string): Promise<Enrollment> {
    return this.updateEnrollmentProgress(courseId, userId, { quizId });
  }

  /**
   * Central method to update progress
   */
  private async updateEnrollmentProgress(
    courseId: string, 
    userId: string, 
    completedItems: { lessonId?: string, quizId?: string }
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel.findOne({ course: courseId, user: userId }).exec();
    if (!enrollment) {
      throw new NotFoundException('التسجيل غير موجود');
    }

    let isUpdated = false;

    if (completedItems.lessonId && !enrollment.completedLessons.includes(completedItems.lessonId as any)) {
      enrollment.completedLessons.push(completedItems.lessonId as any);
      isUpdated = true;
    }

    if (completedItems.quizId && !enrollment.completedQuizzes.includes(completedItems.quizId as any)) {
      enrollment.completedQuizzes.push(completedItems.quizId as any);
      isUpdated = true;
    }

    if (isUpdated) {
      // Calculate new progress
      const chapters = await this.chapterModel.find({ course: courseId }).exec();
      
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
        const completedCount = enrollment.completedLessons.length + enrollment.completedQuizzes.length;
        const progressPercentage = Math.round((completedCount / totalItems) * 100);
        enrollment.progress = Math.min(progressPercentage, 100);
        
        if (enrollment.progress === 100) {
          enrollment.isCompleted = true;
        }
      }
      
      return enrollment.save();
    }
    
    return enrollment;
  }
}
