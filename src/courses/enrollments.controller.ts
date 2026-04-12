import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { MarkEnrollmentUserDto } from './dto/mark-enrollment-user.dto';
import { AddOrUpdateCourseReviewDto } from './dto/add-or-update-course-review.dto';

@ApiTags('Enrollment & Progress')
@ApiBearerAuth('JWT-access')
@Controller('courses')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post(':id/enroll')
  @ApiParam({ name: 'id', description: 'معرّف الدورة (Mongo ObjectId)' })
  @ApiBody({
    description:
      'لا حاجة لحقول في الجسم؛ يُحدد المستخدم من ترويسة Authorization (access token).',
    schema: { type: 'object', additionalProperties: false, example: {} },
  })
  @ApiOperation({
    summary: 'Enroll a user in a course',
    description: 'يتطلب access token؛ يُستخرج معرّف المستخدم من الرمز وليس من الجسم.',
  })
  enroll(@Param('id') id: string, @Req() req: Request & { user: { id: string } }) {
    return this.enrollmentsService.enroll(id, req.user.id);
  }

  @Get(':id/progress/:userId')
  @ApiParam({ name: 'id', description: 'معرّف الدورة' })
  @ApiParam({ name: 'userId', description: 'معرّف المستخدم' })
  @ApiOperation({ summary: 'Get user progress for a course' })
  getCourseProgress(@Param('id') id: string, @Param('userId') userId: string) {
    return this.enrollmentsService.getEnrollment(id, userId);
  }

  @Post(':id/progress/lesson/:lessonId')
  @ApiParam({ name: 'id', description: 'معرّف الدورة' })
  @ApiParam({ name: 'lessonId', description: 'معرّف الدرس' })
  @ApiOperation({ summary: 'Mark a lesson as completed for a user' })
  markLessonCompleted(
    @Param('id') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: MarkEnrollmentUserDto,
  ) {
    return this.enrollmentsService.markLessonCompleted(courseId, body.userId, lessonId);
  }

  @Post(':id/progress/quiz/:quizId')
  @ApiParam({ name: 'id', description: 'معرّف الدورة' })
  @ApiParam({ name: 'quizId', description: 'معرّف الاختبار' })
  @ApiOperation({ summary: 'Mark a quiz as completed for a user' })
  markQuizCompleted(
    @Param('id') courseId: string,
    @Param('quizId') quizId: string,
    @Body() body: MarkEnrollmentUserDto,
  ) {
    return this.enrollmentsService.markQuizCompleted(courseId, body.userId, quizId);
  }

  @Post(':id/reviews')
  @ApiParam({ name: 'id', description: 'معرّف الدورة' })
  @ApiOperation({ summary: 'إضافة أو تحديث تقييم وتعليق لدورة تدريبية' })
  addOrUpdateReview(
    @Param('id') courseId: string,
    @Body() body: AddOrUpdateCourseReviewDto,
  ) {
    return this.enrollmentsService.addOrUpdateReview(
      courseId,
      body.userId,
      body.rating,
      body.comment,
    );
  }

  @Get(':id/reviews')
  @ApiParam({ name: 'id', description: 'معرّف الدورة' })
  @ApiOperation({ summary: 'جلب جميع التقييمات والتعليقات لدورة تدريبية' })
  getCourseReviews(@Param('id') courseId: string) {
    return this.enrollmentsService.getCourseReviews(courseId);
  }
}
