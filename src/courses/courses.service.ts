import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseDocument } from './schemas/course.schema';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { Slide, SlideDocument } from '../slides/schemas/slide.schema';
import { PopulateLevel } from './dto/course-query.dto';
import { BunnyService } from '../common/services/bunny.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(Slide.name) private slideModel: Model<SlideDocument>,
    private readonly bunnyService: BunnyService
  ) { }

  async create(createCourseDto: CreateCourseDto, files: { cover: Express.Multer.File[], thumbnail: Express.Multer.File[] }): Promise<Course> {
    const { cover, thumbnail } = files;

    const createdCourse = new this.courseModel(createCourseDto);
    return createdCourse.save();
  }

  /**
   * Get all courses with flexible population
   * @param populateLevel - Level of nested population
   * @param includeCategory - Whether to include category
   */
  async findAll(populateLevel: PopulateLevel = PopulateLevel.CHAPTERS, includeCategory: boolean = true): Promise<any[]> {
    let query = this.courseModel.find();

    // Populate category if requested
    if (includeCategory) {
      query = query.populate('category');
    }

    // Populate based on level
    switch (populateLevel) {
      case PopulateLevel.NONE:
        // No additional population
        break;
      case PopulateLevel.CHAPTERS:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
        });
        break;
      case PopulateLevel.LESSONS:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
          },
        });
        break;
      case PopulateLevel.SLIDES:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
            populate: {
              path: 'slides',
              options: { sort: { orderIndex: 1 } },
            },
          },
        });
        break;
      case PopulateLevel.QUIZZES:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'quiz',
          },
        });
        break;
      case PopulateLevel.FULL:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: [
            {
              path: 'lessons',
              options: { sort: { orderIndex: 1 } },
              populate: {
                path: 'slides',
                options: { sort: { orderIndex: 1 } },
              },
            },
            {
              path: 'quiz',
            },
          ],
        });
        break;
    }

    const courses = await query.exec();
    return this.mapCoursesResponse(courses, populateLevel);
  }

  /**
   * Get a single course by ID with flexible population
   */
  async findOne(id: string, populateLevel: PopulateLevel = PopulateLevel.FULL, includeCategory: boolean = true): Promise<any> {
    let query = this.courseModel.findById(id);

    // Populate category if requested
    if (includeCategory) {
      query = query.populate('category');
    }

    // Populate based on level
    switch (populateLevel) {
      case PopulateLevel.NONE:
        break;
      case PopulateLevel.CHAPTERS:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
        });
        break;
      case PopulateLevel.LESSONS:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
          },
        });
        break;
      case PopulateLevel.SLIDES:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
            populate: {
              path: 'slides',
              options: { sort: { orderIndex: 1 } },
            },
          },
        });
        break;
      case PopulateLevel.QUIZZES:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'quiz',
          },
        });
        break;
      case PopulateLevel.FULL:
        query = query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: [
            {
              path: 'lessons',
              options: { sort: { orderIndex: 1 } },
              populate: {
                path: 'slides',
                options: { sort: { orderIndex: 1 } },
              },
            },
            {
              path: 'quiz',
            },
          ],
        });
        break;
    }

    const course = await query.exec();
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return this.mapCourseResponse(course, populateLevel);
  }

  /**
   * Get course with chapters only
   */
  async findOneWithChapters(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.CHAPTERS);
  }

  /**
   * Get course with chapters and lessons
   */
  async findOneWithLessons(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.LESSONS);
  }

  /**
   * Get course with chapters, lessons, and slides
   */
  async findOneWithSlides(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.SLIDES);
  }

  /**
   * Get course with chapters and quizzes
   */
  async findOneWithQuizzes(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.QUIZZES);
  }

  /**
   * Get course with everything populated
   */
  async findOneFull(id: string): Promise<any> {
    return this.findOne(id, PopulateLevel.FULL);
  }

  /**
   * Map course response to clean structure
   */
  private mapCourseResponse(course: any, populateLevel: PopulateLevel): any {
    const mapped: any = {
      _id: course._id,
      name: course.name,
      description: course.description,
      price: course.price,
      estimationTime: course.estimationTime,
      coverImage: course.coverImage,
      thumbnailImage: course.thumbnailImage,
      willLearn: course.willLearn,
      requirements: course.requirements,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    // Include category if populated
    if (course.category) {
      mapped.category = typeof course.category === 'object' ? {
        _id: course.category._id,
        name: course.category.name,
        description: course.category.description,
        image: course.category.image,
      } : course.category;
    }

    // Map chapters based on populate level
    if (course.chapters && Array.isArray(course.chapters)) {
      mapped.chapters = course.chapters.map((chapter: any) => this.mapChapterResponse(chapter, populateLevel));
    }

    return mapped;
  }

  /**
   * Map chapter response
   */
  private mapChapterResponse(chapter: any, populateLevel: PopulateLevel): any {
    const mapped: any = {
      _id: chapter._id,
      title: chapter.title,
      description: chapter.description,
      orderIndex: chapter.orderIndex,
      isCompleted: chapter.isCompleted,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };

    // Include lessons if populated or if level requires it
    if (chapter.lessons && Array.isArray(chapter.lessons) && chapter.lessons.length > 0) {
      // Check if lessons are populated (have title property) or just IDs
      if (chapter.lessons[0] && typeof chapter.lessons[0] === 'object' && chapter.lessons[0].title) {
        mapped.lessons = chapter.lessons.map((lesson: any) => this.mapLessonResponse(lesson, populateLevel));
      } else if (populateLevel === PopulateLevel.LESSONS || populateLevel === PopulateLevel.SLIDES || populateLevel === PopulateLevel.FULL) {
        // If we need lessons but they're not populated, return IDs
        mapped.lessonIds = chapter.lessons.map((lesson: any) => lesson._id || lesson);
      }
    }

    // Include quiz if populated
    if (chapter.quiz) {
      if (typeof chapter.quiz === 'object' && chapter.quiz.title) {
        mapped.quiz = this.mapQuizResponse(chapter.quiz);
      } else if (populateLevel === PopulateLevel.QUIZZES || populateLevel === PopulateLevel.FULL) {
        mapped.quizId = chapter.quiz._id || chapter.quiz;
      }
    }

    return mapped;
  }

  /**
   * Map lesson response
   */
  private mapLessonResponse(lesson: any, populateLevel: PopulateLevel): any {
    const mapped: any = {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      orderIndex: lesson.orderIndex,
      estimatedDuration: lesson.estimatedDuration,
      isCompleted: lesson.isCompleted,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };

    // Include slides if populated and level includes slides
    if ((populateLevel === PopulateLevel.SLIDES || populateLevel === PopulateLevel.FULL) && 
        lesson.slides && Array.isArray(lesson.slides)) {
      mapped.slides = lesson.slides.map((slide: any) => this.mapSlideResponse(slide));
    } else if (lesson.slides && Array.isArray(lesson.slides)) {
      // Just include slide IDs if not fully populated
      mapped.slideIds = lesson.slides.map((slide: any) => slide._id || slide);
    }

    return mapped;
  }

  /**
   * Map slide response
   */
  private mapSlideResponse(slide: any): any {
    return {
      _id: slide._id,
      title: slide.title,
      type: slide.type,
      textContent: slide.textContent,
      imageUrl: slide.imageUrl,
      orderIndex: slide.orderIndex,
      questions: slide.questions,
      questionHint: slide.questionHint,
      answer: slide.answer,
      isCompleted: slide.isCompleted,
      createdAt: slide.createdAt,
      updatedAt: slide.updatedAt,
    };
  }

  /**
   * Map quiz response
   */
  private mapQuizResponse(quiz: any): any {
    // Sort questions by orderIndex if they exist
    const questions = quiz.questions && Array.isArray(quiz.questions)
      ? [...quiz.questions].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))
      : quiz.questions;

    return {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      questions: questions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      isCompleted: quiz.isCompleted,
      score: quiz.score,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };
  }

  /**
   * Map multiple courses response
   */
  private mapCoursesResponse(courses: any[], populateLevel: PopulateLevel): any[] {
    return courses.map(course => this.mapCourseResponse(course, populateLevel));
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const updatedCourse = await this.courseModel.findByIdAndUpdate(id, updateCourseDto, { new: true }).exec();
    if (!updatedCourse) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return updatedCourse;
  }

  async remove(id: string): Promise<Course> {
    const deletedCourse = await this.courseModel.findByIdAndDelete(id).exec();
    if (!deletedCourse) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return deletedCourse;
  }
}
