import { Injectable } from '@nestjs/common';
import { PopulateLevel } from './dto/course-query.dto';
import { CourseReviewsMap, CourseStatsMap } from './course-stats.service';
import type { CourseProgressAccess } from './enrollments.service';

@Injectable()
export class CourseResponseMapperService {
  mapCoursesResponse(
    courses: any[],
    populateLevel: PopulateLevel,
    statsMap?: CourseStatsMap,
    bookmarkedSet?: Set<string>,
    reviewsMap?: CourseReviewsMap,
    accessMap?: Record<string, CourseProgressAccess | undefined>,
  ): any[] {
    return courses.map((course) => {
      const key = course._id?.toString?.() ?? '';
      return this.mapCourseResponse(
        course,
        populateLevel,
        statsMap ? statsMap[key] : undefined,
        bookmarkedSet ? bookmarkedSet.has(key) : false,
        reviewsMap ? reviewsMap[key] : undefined,
        accessMap ? accessMap[key] : undefined,
      );
    });
  }

  mapCourseResponse(
    course: any,
    populateLevel: PopulateLevel,
    stats?: { enrollmentsCount?: number; averageRating?: number | null },
    isBookmarked?: boolean,
    reviewsBundle?: { reviews: any[]; reviewsCount: number },
    access?: CourseProgressAccess,
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

      this.applySequentialLocks(mapped.chapters, access);
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
      isLocked: !!chapter.isLocked,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };

    if (
      chapter.lessons &&
      Array.isArray(chapter.lessons) &&
      chapter.lessons.length > 0
    ) {
      if (
        chapter.lessons[0] &&
        typeof chapter.lessons[0] === 'object' &&
        chapter.lessons[0].title
      ) {
        mapped.lessons = chapter.lessons.map((lesson: any) =>
          this.mapLessonResponse(lesson, populateLevel),
        );
      } else if (
        populateLevel === PopulateLevel.LESSONS ||
        populateLevel === PopulateLevel.SLIDES ||
        populateLevel === PopulateLevel.FULL
      ) {
        mapped.lessonIds = chapter.lessons.map(
          (lesson: any) => lesson._id || lesson,
        );
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
      isLocked: !!lesson.isLocked,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };

    if (
      (populateLevel === PopulateLevel.SLIDES ||
        populateLevel === PopulateLevel.FULL) &&
      lesson.slides &&
      Array.isArray(lesson.slides)
    ) {
      mapped.slides = lesson.slides.map((slide: any) =>
        this.mapSlideResponse(slide),
      );
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
        ? [...quiz.questions].sort(
            (a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0),
          )
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

  private applySequentialLocks(
    chapters: any[],
    access?: CourseProgressAccess,
  ): void {
    if (!access) {
      for (const chapter of chapters) {
        this.lockChapter(chapter);
      }
      return;
    }

    let previousChaptersCompleted = true;

    for (const chapter of chapters) {
      const chapterIsAccessible = previousChaptersCompleted;
      chapter.isLocked = !!chapter.isLocked || !chapterIsAccessible;

      if (chapter.isLocked) {
        this.lockChapter(chapter);
      } else {
        this.applyLessonLocks(chapter, access);
        this.applyQuizLock(chapter, access, false);
      }

      chapter.isCompleted = this.isChapterCompleted(chapter, access);
      previousChaptersCompleted =
        previousChaptersCompleted && chapter.isCompleted && !chapter.isLocked;
    }
  }

  private applyLessonLocks(chapter: any, access: CourseProgressAccess): void {
    if (!Array.isArray(chapter.lessons)) {
      return;
    }

    let previousLessonsCompleted = true;
    for (const lesson of chapter.lessons) {
      const lessonId = this.toIdString(lesson._id);
      lesson.isCompleted = access.completedLessonIds.has(lessonId);
      lesson.isLocked = !!lesson.isLocked || !previousLessonsCompleted;

      if (lesson.isLocked) {
        delete lesson.slides;
        delete lesson.slideIds;
      }

      previousLessonsCompleted =
        previousLessonsCompleted && lesson.isCompleted && !lesson.isLocked;
    }
  }

  private applyQuizLock(
    chapter: any,
    access: CourseProgressAccess,
    forceLocked: boolean,
  ): void {
    if (!chapter.quiz) {
      return;
    }

    const quizId = this.toIdString(chapter.quiz._id ?? chapter.quiz);
    chapter.quiz.isCompleted = access.completedQuizIds.has(quizId);
    chapter.quiz.isLocked = forceLocked;

    if (forceLocked) {
      delete chapter.quiz.questions;
    }
  }

  private lockChapter(chapter: any): void {
    chapter.isLocked = true;

    if (Array.isArray(chapter.lessons)) {
      for (const lesson of chapter.lessons) {
        lesson.isLocked = true;
        delete lesson.slides;
        delete lesson.slideIds;
      }
    }

    if (chapter.quiz) {
      this.applyQuizLock(
        chapter,
        { completedLessonIds: new Set(), completedQuizIds: new Set() },
        true,
      );
    }
  }

  private isChapterCompleted(
    chapter: any,
    access: CourseProgressAccess,
  ): boolean {
    if (Array.isArray(chapter.lessons) && chapter.lessons.length > 0) {
      return chapter.lessons.every((lesson: any) =>
        access.completedLessonIds.has(this.toIdString(lesson._id)),
      );
    }

    if (chapter.quiz) {
      return access.completedQuizIds.has(
        this.toIdString(chapter.quiz._id ?? chapter.quiz),
      );
    }

    return true;
  }

  private toIdString(value: any): string {
    return value?._id?.toString?.() ?? value?.toString?.() ?? '';
  }
}
