import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Enrollment & Progress')
@Controller('courses')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll a user in a course' })
  enroll(@Param('id') id: string, @Body('userId') userId: string) {
    return this.enrollmentsService.enroll(id, userId);
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
}
