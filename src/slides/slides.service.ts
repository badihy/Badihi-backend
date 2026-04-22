import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { Slide, SlideDocument } from './schemas/slide.schema';
import { Lesson, LessonDocument } from '../courses/schemas/lesson.schema';
import { EnrollmentsService } from '../courses/enrollments.service';

@Injectable()
export class SlidesService {
  constructor(
    @InjectModel(Slide.name) private readonly slideModel: Model<SlideDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  /**
   * Create a slide and link it to its parent lesson
   */
  async create(createSlideDto: CreateSlideDto): Promise<Slide> {
    const lesson = await this.lessonModel
      .findById(createSlideDto.lesson)
      .exec();
    if (!lesson) {
      throw new NotFoundException(
        `Lesson with id ${createSlideDto.lesson} was not found`,
      );
    }

    const slide = await this.slideModel.create({
      ...createSlideDto,
      lesson: createSlideDto.lesson,
    });

    await this.lessonModel
      .findByIdAndUpdate(createSlideDto.lesson, {
        $addToSet: { slides: slide._id },
      })
      .exec();

    return slide;
  }

  /**
   * Get all slides (optionally by lessonId)
   */
  async findAll(lessonId?: string, userId?: string): Promise<Slide[]> {
    const filter: any = {};

    if (lessonId) {
      const lesson = await this.lessonModel.findById(lessonId).exec();
      if (!lesson) {
        throw new NotFoundException(`Lesson with id ${lessonId} was not found`);
      }
      if (userId) {
        await this.enrollmentsService.assertLessonAccessibleById(
          userId,
          lessonId,
        );
      }
      filter.lesson = lessonId;
    } else if (userId) {
      throw new BadRequestException('يجب تحديد الدرس لعرض السلايدز');
    }

    return this.slideModel.find(filter).sort({ orderIndex: 1 }).exec();
  }

  /**
   * Get one slide by id
   */
  async findOne(id: string, userId?: string): Promise<Slide> {
    const slide = await this.slideModel.findById(id).exec();
    if (!slide) {
      throw new NotFoundException(`Slide with id ${id} was not found`);
    }
    if (userId) {
      await this.enrollmentsService.assertLessonAccessibleById(
        userId,
        slide.lesson.toString(),
      );
    }
    return slide;
  }

  /**
   * Update slide by id
   * - Does not allow changing lesson to avoid inconsistent ordering/linking.
   */
  async update(id: string, updateSlideDto: UpdateSlideDto): Promise<Slide> {
    if ((updateSlideDto as any).lesson) {
      throw new BadRequestException(
        'The lesson linked to this slide cannot be changed',
      );
    }

    const updated = await this.slideModel
      .findByIdAndUpdate(id, updateSlideDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Slide with id ${id} was not found`);
    }
    return updated;
  }

  /**
   * Remove slide and unlink from lesson
   */
  async remove(id: string): Promise<{ message: string }> {
    const slide = await this.slideModel.findById(id).exec();
    if (!slide) {
      throw new NotFoundException(`Slide with id ${id} was not found`);
    }

    await this.lessonModel
      .findByIdAndUpdate(slide.lesson, { $pull: { slides: slide._id } })
      .exec();
    await this.slideModel.findByIdAndDelete(id).exec();

    return { message: 'Slide deleted successfully' };
  }
}
