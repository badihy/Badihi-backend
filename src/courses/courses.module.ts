import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseSchema } from './schemas/course.schema';
import { ChapterSchema } from './schemas/chapter.schema';
import { LessonSchema } from './schemas/lesson.schema';
import { QuizSchema } from './schemas/quiz.schema';
import { BunnyService } from '../common/services/bunny.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Course', schema: CourseSchema },
      { name: 'Chapter', schema: ChapterSchema },
      { name: 'Lesson', schema: LessonSchema },
      { name: 'Quiz', schema: QuizSchema },
    ])
  ],
  controllers: [CoursesController],
  providers: [CoursesService, BunnyService],
  exports: [CoursesService, MongooseModule] // Export MongooseModule for seeding scripts
})
export class CoursesModule { }
