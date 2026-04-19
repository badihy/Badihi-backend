import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const userServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateUsername: jest.fn(),
    updateProfileImage: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userServiceMock }],
    }).compile();

    controller = module.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  it('allows reading the authenticated user profile', async () => {
    await controller.findOne('user-1', 'user-1');

    expect(userServiceMock.findById).toHaveBeenCalledWith('user-1');
  });

  it('blocks updating another user profile', async () => {
    expect(() =>
      controller.update('user-2', { fullName: 'Ali' }, 'user-1'),
    ).toThrow(ForbiddenException);
    expect(userServiceMock.update).not.toHaveBeenCalled();
  });
});
