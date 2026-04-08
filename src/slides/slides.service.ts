import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { Slide, SlideDocument } from './schemas/slide.schema';
import { Lesson, LessonDocument } from '../courses/schemas/lesson.schema';

@Injectable()
export class SlidesService {
  constructor(
    @InjectModel(Slide.name) private readonly slideModel: Model<SlideDocument>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
  ) {}

  /**
   * Create a slide and link it to its parent lesson
   */
  async create(createSlideDto: CreateSlideDto): Promise<Slide> {
    const lesson = await this.lessonModel.findById(createSlideDto.lesson).exec();
    if (!lesson) {
      throw new NotFoundException(`الدرس بالمعرف ${createSlideDto.lesson} غير موجود`);
    }

    const slide = await this.slideModel.create({
      ...createSlideDto,
      lesson: createSlideDto.lesson,
    });

    await this.lessonModel
      .findByIdAndUpdate(createSlideDto.lesson, { $addToSet: { slides: slide._id } })
      .exec();

    return slide;
  }

  /**
   * Get all slides (optionally by lessonId)
   */
  async findAll(lessonId?: string): Promise<Slide[]> {
    const filter: any = {};

    if (lessonId) {
      const lesson = await this.lessonModel.findById(lessonId).exec();
      if (!lesson) {
        throw new NotFoundException(`الدرس بالمعرف ${lessonId} غير موجود`);
      }
      filter.lesson = lessonId;
    }

    return this.slideModel.find(filter).sort({ orderIndex: 1 }).exec();
  }

  /**
   * Get one slide by id
   */
  async findOne(id: string): Promise<Slide> {
    const slide = await this.slideModel.findById(id).exec();
    if (!slide) {
      throw new NotFoundException(`الشريحة بالمعرف ${id} غير موجودة`);
    }
    return slide;
  }

  /**
   * Update slide by id
   * - Does not allow changing lesson to avoid inconsistent ordering/linking.
   */
  async update(id: string, updateSlideDto: UpdateSlideDto): Promise<Slide> {
    if ((updateSlideDto as any).lesson) {
      throw new BadRequestException('لا يمكن تغيير الدرس المرتبط بالشريحة');
    }

    const updated = await this.slideModel.findByIdAndUpdate(id, updateSlideDto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException(`الشريحة بالمعرف ${id} غير موجودة`);
    }
    return updated;
  }

  /**
   * Remove slide and unlink from lesson
   */
  async remove(id: string): Promise<{ message: string }> {
    const slide = await this.slideModel.findById(id).exec();
    if (!slide) {
      throw new NotFoundException(`الشريحة بالمعرف ${id} غير موجودة`);
    }

    await this.lessonModel.findByIdAndUpdate(slide.lesson, { $pull: { slides: slide._id } }).exec();
    await this.slideModel.findByIdAndDelete(id).exec();

    return { message: 'تم حذف الشريحة بنجاح' };
  }
}
