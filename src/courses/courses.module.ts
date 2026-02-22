import { forwardRef, Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseSchema } from './schemas/course.schema';
import { ChapterSchema } from './schemas/chapter.schema';
import { LessonSchema } from './schemas/lesson.schema';
import { QuizSchema } from './schemas/quiz.schema';
import { SlideSchema } from '../slides/schemas/slide.schema';
import { EnrollmentSchema } from './schemas/enrollment.schema';
import { BunnyService } from '../common/services/bunny.service';
import { UserModule } from '../user/user.module';
import { ChaptersService } from './chapters.service';
import { EnrollmentsService } from './enrollments.service';
import { ChaptersController } from './chapters.controller';
import { EnrollmentsController } from './enrollments.controller';
import { LessonsController } from './lessons.controller';
import { QuizzesController } from './quizzes.controller';
import { LessonsService } from './lessons.service';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    MongooseModule.forFeature([
      { name: 'Course', schema: CourseSchema },
      { name: 'Chapter', schema: ChapterSchema },
      { name: 'Lesson', schema: LessonSchema },
      { name: 'Quiz', schema: QuizSchema },
      { name: 'Slide', schema: SlideSchema },
      { name: 'Enrollment', schema: EnrollmentSchema },
    ])
  ],
  controllers: [
    CoursesController, 
    ChaptersController, 
    LessonsController,
    QuizzesController,
    EnrollmentsController
  ],
  providers: [
    CoursesService, 
    BunnyService, 
    ChaptersService, 
    LessonsService,
    QuizzesService,
    EnrollmentsService
  ],
  exports: [CoursesService, MongooseModule] // Export MongooseModule for seeding scripts
})
export class CoursesModule { }
