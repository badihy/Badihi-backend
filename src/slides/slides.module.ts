import { Module } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { SlidesController } from './slides.controller';
import { SlideSchema } from './schemas/slide.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Slide', schema: SlideSchema }])],
  controllers: [SlidesController],
  providers: [SlidesService],
})
export class SlidesModule { }
