import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    const chapter = await this.chapterModel
      .findById(createQuizDto.chapter)
      .exec();
    if (!chapter) {
      throw new NotFoundException(
        `Chapter with id ${createQuizDto.chapter} was not found`,
      );
    }

    // A chapter cannot have both lessons and a quiz
    if (chapter.lessons && chapter.lessons.length > 0) {
      throw new BadRequestException(
        'A quiz cannot be added to a chapter that already has lessons. A chapter can contain lessons or a quiz, but not both.',
      );
    }

    if (chapter.quiz) {
      throw new BadRequestException(
        'This chapter already has a quiz. Delete the current quiz first or update it instead.',
      );
    }

    const quiz = new this.quizModel(createQuizDto);
    const savedQuiz = await quiz.save();

    // Link quiz to the chapter
    await this.chapterModel
      .findByIdAndUpdate(createQuizDto.chapter, { quiz: savedQuiz._id })
      .exec();

    return savedQuiz;
  }

  /**
   * Get the quiz associated with a specific chapter
   */
  async findQuizByChapter(chapterId: string): Promise<Quiz> {
    const chapter = await this.chapterModel
      .findById(chapterId)
      .populate('quiz')
      .exec();
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} was not found`);
    }

    if (!chapter.quiz) {
      throw new NotFoundException(`No quiz is linked to chapter ${chapterId}`);
    }

    return chapter.quiz as any;
  }

  /**
   * Get a single quiz by ID
   */
  async findOneQuiz(id: string): Promise<Quiz> {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) {
      throw new NotFoundException(`Quiz with id ${id} was not found`);
    }

    return quiz;
  }

  /**
   * Update a quiz by ID
   */
  async updateQuiz(
    id: string,
    updateData: Partial<CreateQuizDto>,
  ): Promise<Quiz> {
    const updatedQuiz = await this.quizModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedQuiz) {
      throw new NotFoundException(`Quiz with id ${id} was not found`);
    }

    return updatedQuiz;
  }

  /**
   * Delete a quiz and remove its reference from the parent chapter
   */
  async removeQuiz(id: string): Promise<Quiz> {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) {
      throw new NotFoundException(`Quiz with id ${id} was not found`);
    }

    // Remove quiz reference from the parent chapter
    await this.chapterModel
      .findByIdAndUpdate(quiz.chapter, { $unset: { quiz: '' } })
      .exec();

    return (await this.quizModel.findByIdAndDelete(id).exec())!;
  }
}
