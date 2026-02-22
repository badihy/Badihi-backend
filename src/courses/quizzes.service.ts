import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
  ) {}

  /**
   * Create a new quiz and link it to its parent chapter.
   * A chapter can only have one quiz and cannot have lessons at the same time.
   */
  async createQuiz(createQuizDto: CreateQuizDto): Promise<Quiz> {
    const chapter = await this.chapterModel.findById(createQuizDto.chapter).exec();
    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${createQuizDto.chapter} غير موجود`);
    }

    // A chapter cannot have both lessons and a quiz
    if (chapter.lessons && chapter.lessons.length > 0) {
      throw new BadRequestException('لا يمكن إضافة اختبار لفصل يحتوي على دروس. يمكن للفصل احتواء دروس أو اختبار فقط.');
    }

    if (chapter.quiz) {
      throw new BadRequestException('هذا الفصل لديه اختبار بالفعل. يرجى حذف الاختبار الحالي أولاً أو تحديثه.');
    }

    const quiz = new this.quizModel(createQuizDto);
    const savedQuiz = await quiz.save();

    // Link quiz to the chapter
    await this.chapterModel.findByIdAndUpdate(
      createQuizDto.chapter,
      { quiz: savedQuiz._id },
    ).exec();

    return savedQuiz;
  }

  /**
   * Get the quiz associated with a specific chapter
   */
  async findQuizByChapter(chapterId: string): Promise<Quiz> {
    const chapter = await this.chapterModel.findById(chapterId).populate('quiz').exec();
    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${chapterId} غير موجود`);
    }

    if (!chapter.quiz) {
      throw new NotFoundException(`لا يوجد اختبار مرتبط بالفصل ${chapterId}`);
    }

    return chapter.quiz as any;
  }

  /**
   * Get a single quiz by ID
   */
  async findOneQuiz(id: string): Promise<Quiz> {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) {
      throw new NotFoundException(`الاختبار بالمعرف ${id} غير موجود`);
    }

    return quiz;
  }

  /**
   * Update a quiz by ID
   */
  async updateQuiz(id: string, updateData: Partial<CreateQuizDto>): Promise<Quiz> {
    const updatedQuiz = await this.quizModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedQuiz) {
      throw new NotFoundException(`الاختبار بالمعرف ${id} غير موجود`);
    }

    return updatedQuiz;
  }

  /**
   * Delete a quiz and remove its reference from the parent chapter
   */
  async removeQuiz(id: string): Promise<Quiz> {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) {
      throw new NotFoundException(`الاختبار بالمعرف ${id} غير موجود`);
    }

    // Remove quiz reference from the parent chapter
    await this.chapterModel.findByIdAndUpdate(
      quiz.chapter,
      { $unset: { quiz: '' } },
    ).exec();

    return (await this.quizModel.findByIdAndDelete(id).exec())!;
  }
}
