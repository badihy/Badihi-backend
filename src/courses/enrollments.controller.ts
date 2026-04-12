import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('Enrollment & Progress')
@ApiBearerAuth('JWT-access')
@Controller('courses')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post(':id/enroll')
  @ApiOperation({
    summary: 'Enroll a user in a course',
    description: 'يتطلب access token؛ يُستخرج معرّف المستخدم من الرمز وليس من الجسم.',
  })
  enroll(@Param('id') id: string, @Req() req: Request & { user: { id: string } }) {
    return this.enrollmentsService.enroll(id, req.user.id);
  }

  @Get(':id/progress/:userId')
  @ApiOperation({ summary: 'Get user progress for a course' })
  getCourseProgress(@Param('id') id: string, @Param('userId') userId: string) {
    return this.enrollmentsService.getEnrollment(id, userId);
  }

  @Post(':id/progress/lesson/:lessonId')
  @ApiOperation({ summary: 'Mark a lesson as completed for a user' })
  markLessonCompleted(
    @Param('id') courseId: string, 
    @Param('lessonId') lessonId: string,
    @Body('userId') userId: string
  ) {
    return this.enrollmentsService.markLessonCompleted(courseId, userId, lessonId);
  }

  @Post(':id/progress/quiz/:quizId')
  @ApiOperation({ summary: 'Mark a quiz as completed for a user' })
  markQuizCompleted(
    @Param('id') courseId: string, 
    @Param('quizId') quizId: string,
    @Body('userId') userId: string
  ) {
    return this.enrollmentsService.markQuizCompleted(courseId, userId, quizId);
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'إضافة أو تحديث تقييم وتعليق لدورة تدريبية' })
  addOrUpdateReview(
    @Param('id') courseId: string,
    @Body('userId') userId: string,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
  ) {
    return this.enrollmentsService.addOrUpdateReview(courseId, userId, Number(rating), comment);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'جلب جميع التقييمات والتعليقات لدورة تدريبية' })
  getCourseReviews(@Param('id') courseId: string) {
    return this.enrollmentsService.getCourseReviews(courseId);
  }
}
