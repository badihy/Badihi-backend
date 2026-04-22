import { Module } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { SlidesController } from './slides.controller';
import { SlideSchema } from './schemas/slide.schema';
import { LessonSchema } from '../courses/schemas/lesson.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    CoursesModule,
    MongooseModule.forFeature([
      { name: 'Slide', schema: SlideSchema },
      { name: 'Lesson', schema: LessonSchema },
    ]),
  ],
  controllers: [SlidesController],
  providers: [SlidesService],
  exports: [MongooseModule], // Export MongooseModule for seeding scripts
})
export class SlidesModule {}
