import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Course, CourseDocument } from './schemas/course.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { CreateChapterDto } from './dto/create-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
  ) {}

  /**
   * Create a new chapter and link it to its parent course
   */
  async createChapter(createChapterDto: CreateChapterDto): Promise<Chapter> {
    const course = await this.courseModel.findById(createChapterDto.course).exec();
    if (!course) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${createChapterDto.course} غير موجودة`);
    }

    const chapter = new this.chapterModel(createChapterDto);
    const savedChapter = await chapter.save();

    // Push chapter reference into the course
    await this.courseModel.findByIdAndUpdate(
      createChapterDto.course,
      { $push: { chapters: savedChapter._id } },
    ).exec();

    return savedChapter;
  }

  /**
   * Get all chapters for a specific course
   */
  async findAllChapters(courseId: string): Promise<Chapter[]> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(`الدورة التدريبية بالمعرف ${courseId} غير موجودة`);
    }

    return this.chapterModel
      .find({ course: courseId })
      .sort({ orderIndex: 1 })
      .populate({ path: 'lessons', options: { sort: { orderIndex: 1 } } })
      .populate('quiz')
      .exec();
  }

  /**
   * Get a single chapter by ID
   */
  async findOneChapter(id: string): Promise<Chapter> {
    const chapter = await this.chapterModel
      .findById(id)
      .populate({ path: 'lessons', options: { sort: { orderIndex: 1 } } })
      .populate('quiz')
      .exec();

    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${id} غير موجود`);
    }

    return chapter;
  }

  /**
   * Update a chapter by ID
   */
  async updateChapter(id: string, updateData: Partial<CreateChapterDto>): Promise<Chapter> {
    const updatedChapter = await this.chapterModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedChapter) {
      throw new NotFoundException(`الفصل بالمعرف ${id} غير موجود`);
    }

    return updatedChapter;
  }

  /**
   * Delete a chapter and cascade-delete its lessons; remove reference from the course
   */
  async removeChapter(id: string): Promise<Chapter> {
    const chapter = await this.chapterModel.findById(id).exec();
    if (!chapter) {
      throw new NotFoundException(`الفصل بالمعرف ${id} غير موجود`);
    }

    // Cascade delete lessons belonging to this chapter
    if (chapter.lessons && chapter.lessons.length > 0) {
      await this.lessonModel.deleteMany({ chapter: id }).exec();
    }

    // Remove the quiz if it exists
    if (chapter.quiz) {
      await this.quizModel.findByIdAndDelete(chapter.quiz).exec();
    }

    // Remove chapter reference from the parent course
    await this.courseModel.findByIdAndUpdate(
      chapter.course,
      { $pull: { chapters: chapter._id } },
    ).exec();

    return (await this.chapterModel.findByIdAndDelete(id).exec())!;
  }
}
