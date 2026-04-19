import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CourseDocument } from './schemas/course.schema';
import { PopulateLevel } from './dto/course-query.dto';

@Injectable()
export class CourseQueryService {
  buildFindAllQuery(
    courseModel: Model<CourseDocument>,
    populateLevel: PopulateLevel,
    includeCategory: boolean,
    categoryId?: string,
  ) {
    let query = courseModel.find();

    if (categoryId) {
      query = query.where('category').equals(categoryId);
    }

    query = this.applyCategoryPopulate(query, includeCategory);
    return this.applyPopulateLevel(query, populateLevel);
  }

  buildFindOneQuery(
    courseModel: Model<CourseDocument>,
    id: string,
    populateLevel: PopulateLevel,
    includeCategory: boolean,
  ) {
    let query = courseModel.findById(id);
    query = this.applyCategoryPopulate(query, includeCategory);
    return this.applyPopulateLevel(query, populateLevel);
  }

  private applyCategoryPopulate(query: any, includeCategory: boolean) {
    if (includeCategory) {
      return query.populate('category');
    }

    return query;
  }

  private applyPopulateLevel(query: any, populateLevel: PopulateLevel) {
    switch (populateLevel) {
      case PopulateLevel.NONE:
        return query;
      case PopulateLevel.CHAPTERS:
        return query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
        });
      case PopulateLevel.LESSONS:
        return query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'lessons',
            options: { sort: { orderIndex: 1 } },
          },
        });
      case PopulateLevel.SLIDES:
        return query.populate({
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
      case PopulateLevel.QUIZZES:
        return query.populate({
          path: 'chapters',
          options: { sort: { orderIndex: 1 } },
          populate: {
            path: 'quiz',
          },
        });
      case PopulateLevel.FULL:
        return query.populate({
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
      default:
        return query;
    }
  }
}
