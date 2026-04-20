import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Enrollment & Progress')
@ApiBearerAuth('JWT-access')
@Controller('courses')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post(':id/enroll')
  @ApiParam({ name: 'id', description: 'Course id (Mongo ObjectId)' })
  @ApiBody({
    description:
      'No request body fields are needed. The user is determined from the Authorization header access token.',
    schema: { type: 'object', additionalProperties: false, example: {} },
  })
  @ApiOperation({
    summary: 'Enroll a user in a course',
    description:
      'Requires an access token. The user id is extracted from the token, not from the request body.',
  })
  enroll(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.enrollmentsService.enroll(id, req.user.id);
  }

  @Get(':id/progress/:userId')
  @ApiParam({ name: 'id', description: 'Course id' })
  @ApiParam({ name: 'userId', description: 'User id' })
  @ApiOperation({ summary: 'Get user progress for a course' })
  getCourseProgress(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    this.ensureOwnUserScope(userId, currentUserId);
    return this.enrollmentsService.getEnrollment(id, userId);
  }

  @Post(':id/progress/lesson/:lessonId')
  @ApiParam({ name: 'id', description: 'Course id' })
  @ApiParam({ name: 'lessonId', description: 'Lesson id' })
  @ApiOperation({ summary: 'Mark a lesson as completed for a user' })
  markLessonCompleted(
    @Param('id') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: MarkEnrollmentUserDto,
    @CurrentUser('id') userId: string,
  ) {
    void body;
    return this.enrollmentsService.markLessonCompleted(
      courseId,
      userId,
      lessonId,
    );
  }

  @Post(':id/progress/quiz/:quizId')
  @ApiParam({ name: 'id', description: 'Course id' })
  @ApiParam({ name: 'quizId', description: 'Quiz id' })
  @ApiOperation({ summary: 'Mark a quiz as completed for a user' })
  markQuizCompleted(
    @Param('id') courseId: string,
    @Param('quizId') quizId: string,
    @Body() body: MarkEnrollmentUserDto,
    @CurrentUser('id') userId: string,
  ) {
    void body;
    return this.enrollmentsService.markQuizCompleted(courseId, userId, quizId);
  }

  @Post(':id/reviews')
  @ApiParam({ name: 'id', description: 'Course id' })
  @ApiOperation({ summary: 'Add or update a course rating and comment' })
  addOrUpdateReview(
    @Param('id') courseId: string,
    @Body() body: AddOrUpdateCourseReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.enrollmentsService.addOrUpdateReview(
      courseId,
      userId,
      body.rating,
      body.comment,
    );
  }

  @Get(':id/reviews')
  @ApiParam({ name: 'id', description: 'Course id' })
  @ApiOperation({ summary: 'Get all ratings and comments for a course' })
  getCourseReviews(@Param('id') courseId: string) {
    return this.enrollmentsService.getCourseReviews(courseId);
  }

  private ensureOwnUserScope(userId: string, currentUserId: string) {
    if (!currentUserId || userId !== currentUserId) {
      throw new ForbiddenException("You cannot access another user's data");
    }
  }
}
