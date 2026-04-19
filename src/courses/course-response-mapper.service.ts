import { Injectable } from '@nestjs/common';
import { PopulateLevel } from './dto/course-query.dto';
import { CourseReviewsMap, CourseStatsMap } from './course-stats.service';

@Injectable()
export class CourseResponseMapperService {
  mapCoursesResponse(
    courses: any[],
    populateLevel: PopulateLevel,
    statsMap?: CourseStatsMap,
    bookmarkedSet?: Set<string>,
    reviewsMap?: CourseReviewsMap,
  ): any[] {
    return courses.map((course) => {
      const key = course._id?.toString?.() ?? '';
      return this.mapCourseResponse(
        course,
        populateLevel,
        statsMap ? statsMap[key] : undefined,
        bookmarkedSet ? bookmarkedSet.has(key) : false,
        reviewsMap ? reviewsMap[key] : undefined,
      );
    });
  }

  mapCourseResponse(
    course: any,
    populateLevel: PopulateLevel,
    stats?: { enrollmentsCount?: number; averageRating?: number | null },
    isBookmarked?: boolean,
    reviewsBundle?: { reviews: any[]; reviewsCount: number },
  ): any {
    const mapped: any = {
      _id: course._id,
      name: course.name,
      description: course.description,
      shortDescription: course.shortDescription,
      price: course.price,
      estimationTime: course.estimationTime,
      coverImage: course.coverImage,
      thumbnailImage: course.thumbnailImage,
      willLearn: course.willLearn,
      requirements: course.requirements,
      targetAudience: course.targetAudience,
      level: course.level,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      enrollmentsCount: stats?.enrollmentsCount ?? 0,
      averageRating:
        typeof stats?.averageRating === 'number'
          ? Number(stats.averageRating.toFixed(2))
          : 0,
      isBookmarked: !!isBookmarked,
      reviewsCount: reviewsBundle?.reviewsCount ?? 0,
      reviews: reviewsBundle?.reviews ?? [],
    };

    if (course.category) {
      mapped.category =
        typeof course.category === 'object'
          ? {
              _id: course.category._id,
              name: course.category.name,
              description: course.category.description,
              image: course.category.image,
            }
          : course.category;
    }

    if (course.chapters && Array.isArray(course.chapters)) {
      mapped.chapters = course.chapters.map((chapter: any) =>
        this.mapChapterResponse(chapter, populateLevel),
      );
    }

    return mapped;
  }

  private mapChapterResponse(chapter: any, populateLevel: PopulateLevel): any {
    const mapped: any = {
      _id: chapter._id,
      title: chapter.title,
      subtitle: chapter.subtitle,
      description: chapter.description,
      orderIndex: chapter.orderIndex,
      isCompleted: chapter.isCompleted,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };

    if (chapter.lessons && Array.isArray(chapter.lessons) && chapter.lessons.length > 0) {
      if (chapter.lessons[0] && typeof chapter.lessons[0] === 'object' && chapter.lessons[0].title) {
        mapped.lessons = chapter.lessons.map((lesson: any) =>
          this.mapLessonResponse(lesson, populateLevel),
        );
      } else if (
        populateLevel === PopulateLevel.LESSONS ||
        populateLevel === PopulateLevel.SLIDES ||
        populateLevel === PopulateLevel.FULL
      ) {
        mapped.lessonIds = chapter.lessons.map((lesson: any) => lesson._id || lesson);
      }
    }

    if (chapter.quiz) {
      if (typeof chapter.quiz === 'object' && chapter.quiz.title) {
        mapped.quiz = this.mapQuizResponse(chapter.quiz);
      } else if (
        populateLevel === PopulateLevel.QUIZZES ||
        populateLevel === PopulateLevel.FULL
      ) {
        mapped.quizId = chapter.quiz._id || chapter.quiz;
      }
    }

    return mapped;
  }

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

    if (
      (populateLevel === PopulateLevel.SLIDES || populateLevel === PopulateLevel.FULL) &&
      lesson.slides &&
      Array.isArray(lesson.slides)
    ) {
      mapped.slides = lesson.slides.map((slide: any) => this.mapSlideResponse(slide));
    } else if (lesson.slides && Array.isArray(lesson.slides)) {
      mapped.slideIds = lesson.slides.map((slide: any) => slide._id || slide);
    }

    return mapped;
  }

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

  private mapQuizResponse(quiz: any): any {
    const questions =
      quiz.questions && Array.isArray(quiz.questions)
        ? [...quiz.questions].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))
        : quiz.questions;

    return {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      questions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      isCompleted: quiz.isCompleted,
      score: quiz.score,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };
  }
}
