import { CourseResponseMapperService } from './course-response-mapper.service';
import { PopulateLevel } from './dto/course-query.dto';

describe('CourseResponseMapperService', () => {
  let service: CourseResponseMapperService;

  beforeEach(() => {
    service = new CourseResponseMapperService();
  });

  it('sets isUserEnrolled to true when course access exists', () => {
    const result = service.mapCourseResponse(
      {
        _id: 'course-1',
        name: 'Course',
        description: 'Description',
        price: 100,
        estimationTime: '2 hours',
      },
      PopulateLevel.FULL,
      undefined,
      false,
      undefined,
      {
        completedLessonIds: new Set(),
        completedQuizIds: new Set(),
        progress: 30,
        isCompleted: false,
      },
    );

    expect(result.isUserEnrolled).toBe(true);
    expect(result.progress).toBe(30);
    expect(result.isCompleted).toBe(false);
  });

  it('sets isUserEnrolled to false when course access is missing', () => {
    const result = service.mapCourseResponse(
      {
        _id: 'course-1',
        name: 'Course',
        description: 'Description',
        price: 100,
        estimationTime: '2 hours',
      },
      PopulateLevel.FULL,
    );

    expect(result.isUserEnrolled).toBe(false);
  });

  it('includes courseDetails with willLearn and targetAudience', () => {
    const result = service.mapCourseResponse(
      {
        _id: 'course-1',
        name: 'Course',
        description: 'Detailed description',
        shortDescription: 'Short description',
        price: 100,
        estimationTime: '2 hours',
        willLearn: ['Point 1', 'Point 2'],
        requirements: ['Requirement 1'],
        targetAudience: ['Beginners', 'Students'],
        level: 'beginner',
      },
      PopulateLevel.FULL,
    );

    expect(result.courseDetails).toEqual({
      description: 'Detailed description',
      shortDescription: 'Short description',
      willLearn: ['Point 1', 'Point 2'],
      requirements: ['Requirement 1'],
      targetAudience: ['Beginners', 'Students'],
      level: 'beginner',
      estimationTime: '2 hours',
    });
    expect(result.description).toBeUndefined();
    expect(result.shortDescription).toBeUndefined();
    expect(result.willLearn).toBeUndefined();
    expect(result.requirements).toBeUndefined();
    expect(result.targetAudience).toBeUndefined();
    expect(result.level).toBeUndefined();
    expect(result.estimationTime).toBeUndefined();
  });
});
