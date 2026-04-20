import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import {
  Bookmark,
  BookmarkDocument,
} from '../bookmarks/schemas/bookmark.schema';

export type CourseStatsMap = Record<
  string,
  { enrollmentsCount: number; averageRating: number | null }
>;

export type CourseReviewsMap = Record<
  string,
  { reviews: any[]; reviewsCount: number }
>;

@Injectable()
export class CourseStatsService {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Bookmark.name)
    private readonly bookmarkModel: Model<BookmarkDocument>,
  ) {}

  async getBookmarkedCourseIdsSet(
    userId: string | undefined,
    courseIds: any[],
  ) {
    const set = new Set<string>();
    if (!userId || !courseIds?.length) {
      return set;
    }

    const bookmarks = await this.bookmarkModel
      .find({ user: userId, course: { $in: courseIds } })
      .select('course')
      .lean()
      .exec();

    for (const bookmark of bookmarks as any[]) {
      if (bookmark?.course) {
        set.add(bookmark.course.toString());
      }
    }

    return set;
  }

  async getCourseStatsMap(courseIds: any[]): Promise<CourseStatsMap> {
    if (!courseIds?.length) {
      return {};
    }

    const aggregation = await this.enrollmentModel.aggregate([
      {
        $match: {
          course: { $in: courseIds },
        },
      },
      {
        $group: {
          _id: '$course',
          enrollmentsCount: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const statsMap: CourseStatsMap = {};
    for (const item of aggregation) {
      const key = item._id.toString();
      statsMap[key] = {
        enrollmentsCount: item.enrollmentsCount ?? 0,
        averageRating: item.averageRating ?? null,
      };
    }

    return statsMap;
  }

  async getCourseReviewsMap(courseIds: any[]): Promise<CourseReviewsMap> {
    if (!courseIds?.length) {
      return {};
    }

    const rows = await this.enrollmentModel
      .find({
        course: { $in: courseIds },
        ...this.reviewMatchFilter(),
      })
      .populate('user', 'fullName username email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const byCourse: Record<string, any[]> = {};
    for (const row of rows as any[]) {
      const courseId = row.course?.toString?.() ?? String(row.course);
      if (!byCourse[courseId]) {
        byCourse[courseId] = [];
      }
      byCourse[courseId].push(this.mapEnrollmentReviewToDto(row));
    }

    const reviewsMap: CourseReviewsMap = {};
    for (const id of courseIds) {
      const key = id?.toString?.() ?? String(id);
      const reviews = byCourse[key] ?? [];
      reviewsMap[key] = { reviews, reviewsCount: reviews.length };
    }

    return reviewsMap;
  }

  private mapEnrollmentReviewToDto(row: any): any {
    return {
      _id: row._id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: row.user
        ? {
            _id: row.user._id,
            fullName: row.user.fullName,
            username: row.user.username,
            email: row.user.email,
          }
        : null,
    };
  }

  private reviewMatchFilter() {
    return {
      $or: [
        { rating: { $exists: true, $ne: null } },
        { comment: { $exists: true, $nin: [null, ''] } },
      ],
    };
  }
}
