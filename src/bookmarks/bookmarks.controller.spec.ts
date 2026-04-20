import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

describe('BookmarksController', () => {
  let controller: BookmarksController;
  const bookmarksServiceMock = {
    add: jest.fn(),
    remove: jest.fn(),
    findByUser: jest.fn(),
    isBookmarked: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [
        { provide: BookmarksService, useValue: bookmarksServiceMock },
      ],
    }).compile();

    controller = module.get<BookmarksController>(BookmarksController);
    jest.clearAllMocks();
  });

  it('uses the authenticated user when creating a bookmark', async () => {
    await controller.add({ courseId: 'course-1' }, 'user-1');

    expect(bookmarksServiceMock.add).toHaveBeenCalledWith('user-1', 'course-1');
  });

  it('blocks deleting another user bookmark', async () => {
    expect(() => controller.remove('user-2', 'course-1', 'user-1')).toThrow(
      ForbiddenException,
    );
    expect(bookmarksServiceMock.remove).not.toHaveBeenCalled();
  });
});
