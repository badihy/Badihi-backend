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
import { SlideType } from './types/slide-types.enum';

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
  async create(createSlideDto: CreateSlideDto): Promise<any> {
    const lesson = await this.lessonModel
      .findById(createSlideDto.lesson)
      .exec();
    if (!lesson) {
      throw new NotFoundException(
        `Lesson with id ${createSlideDto.lesson} was not found`,
      );
    }

    // Validate Question Slide
    if (createSlideDto.type === SlideType.QUESTION) {
      if (
        !createSlideDto.choices ||
        !createSlideDto.answer ||
        !createSlideDto.choices.includes(createSlideDto.answer)
      ) {
        throw new BadRequestException('يجب أن تكون الإجابة ضمن الاختيارات');
      }
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

    return this.cleanSlide(slide);
  }

  /**
   * Get all slides (optionally by lessonId)
   */
  async findAll(lessonId?: string, userId?: string): Promise<any[]> {
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

    const slides = await this.slideModel
      .find(filter)
      .sort({ orderIndex: 1 })
      .exec();
    return slides.map((slide) => this.cleanSlide(slide));
  }

  /**
   * Get one slide by id
   */
  async findOne(id: string, userId?: string): Promise<any> {
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
    return this.cleanSlide(slide);
  }

  /**
   * Update slide by id
   * - Does not allow changing lesson to avoid inconsistent ordering/linking.
   */
  async update(id: string, updateSlideDto: UpdateSlideDto): Promise<any> {
    if ((updateSlideDto as any).lesson) {
      throw new BadRequestException(
        'The lesson linked to this slide cannot be changed',
      );
    }

    const currentSlide = await this.slideModel.findById(id).exec();
    if (!currentSlide) {
      throw new NotFoundException(`Slide with id ${id} was not found`);
    }

    // Validate Question Slide if type is changed to QUESTION or if answer/choices are updated
    const finalType = updateSlideDto.type || currentSlide.type;
    if (finalType === SlideType.QUESTION) {
      const finalChoices = updateSlideDto.choices || currentSlide.choices;
      const finalAnswer = updateSlideDto.answer || currentSlide.answer;

      if (
        !finalChoices ||
        !finalAnswer ||
        !finalChoices.includes(finalAnswer)
      ) {
        throw new BadRequestException('يجب أن تكون الإجابة ضمن الاختيارات');
      }
    }

    const updated = await this.slideModel
      .findByIdAndUpdate(id, updateSlideDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Slide with id ${id} was not found`);
    }

    return this.cleanSlide(updated);
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

  /**
   * Clean slide object based on its type
   */
  private cleanSlide(slide: SlideDocument): any {
    const obj = slide.toObject();
    const type = obj.type;

    const commonFields = [
      '_id',
      'id',
      'type',
      'orderIndex',
      'lesson',
      'isCompleted',
      'createdAt',
      'updatedAt',
      '__v',
    ];

    const fieldsByType = {
      [SlideType.TEXT]: [
        'title',
        'textContent',
        'imageUrl',
        'golden_info',
        'explanation',
      ],
      [SlideType.QUESTION]: [
        'question',
        'choices',
        'answer',
        'golden_info',
        'explanation',
      ],
      [SlideType.QUOTE]: ['quotation', 'authorName', 'authorJob'],
    };

    const allowedFields = [...commonFields, ...(fieldsByType[type] || [])];

    Object.keys(obj).forEach((key) => {
      if (!allowedFields.includes(key)) {
        delete obj[key];
      }
    });

    return obj;
  }
}
