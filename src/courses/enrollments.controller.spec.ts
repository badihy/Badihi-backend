import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  const enrollmentsServiceMock = {
    enroll: jest.fn(),
    getEnrollment: jest.fn(),
    markLessonCompleted: jest.fn(),
    markQuizCompleted: jest.fn(),
    addOrUpdateReview: jest.fn(),
    getCourseReviews: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        { provide: EnrollmentsService, useValue: enrollmentsServiceMock },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    jest.clearAllMocks();
  });

  it('uses the authenticated user when marking a lesson complete', async () => {
    await controller.markLessonCompleted('course-1', 'lesson-1', {}, 'user-1');

    expect(enrollmentsServiceMock.markLessonCompleted).toHaveBeenCalledWith(
      'course-1',
      'user-1',
      'lesson-1',
    );
  });

  it('blocks reading another user progress', async () => {
    expect(() =>
      controller.getCourseProgress('course-1', 'user-2', 'user-1'),
    ).toThrow(ForbiddenException);
    expect(enrollmentsServiceMock.getEnrollment).not.toHaveBeenCalled();
  });

  it('uses the authenticated user when adding a review', async () => {
    await controller.addOrUpdateReview(
      'course-1',
      { rating: 5, comment: 'Great' },
      'user-1',
    );

    expect(enrollmentsServiceMock.addOrUpdateReview).toHaveBeenCalledWith(
      'course-1',
      'user-1',
      5,
      'Great',
    );
  });
});
