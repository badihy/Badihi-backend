import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';

describe('AdminController', () => {
  let controller: AdminController;
  const adminServiceMock = {
    listUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminServiceMock }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates listUsers to AdminService', async () => {
    const query = new AdminUserQueryDto();
    query.page = 2;
    adminServiceMock.listUsers.mockResolvedValue({ items: [], total: 0 });

    await expect(controller.listUsers(query)).resolves.toEqual({
      items: [],
      total: 0,
    });
    expect(adminServiceMock.listUsers).toHaveBeenCalledWith(query);
  });

  it('delegates deleteUser with actor id', async () => {
    adminServiceMock.deleteUser.mockResolvedValue({ message: 'ok' });

    await expect(controller.deleteUser('u1', 'actor')).resolves.toEqual({
      message: 'ok',
    });
    expect(adminServiceMock.deleteUser).toHaveBeenCalledWith('u1', 'actor');
  });
});
