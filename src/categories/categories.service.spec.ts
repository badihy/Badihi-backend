import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { Category } from './schemas/category.schema';
import { BunnyService } from '../common/services/bunny.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const categoryModelMock = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  const bunnyServiceMock = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getModelToken(Category.name), useValue: categoryModelMock },
        { provide: BunnyService, useValue: bunnyServiceMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  it('keeps the current image when updating without a new file', async () => {
    const existingCategory = { _id: 'cat-1', image: 'old-image-url' };
    const updatedCategory = { _id: 'cat-1', image: 'old-image-url', name: 'Updated' };

    categoryModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingCategory),
    });
    categoryModelMock.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(updatedCategory),
    });

    await service.update('cat-1', { name: 'Updated' }, undefined as any);

    expect(categoryModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'cat-1',
      { name: 'Updated' },
      { new: true },
    );
    expect(bunnyServiceMock.deleteFile).not.toHaveBeenCalled();
  });

  it('deletes the previous image after uploading a replacement', async () => {
    const existingCategory = { _id: 'cat-1', image: 'old-image-url' };
    const updatedCategory = { _id: 'cat-1', image: 'new-image-url', name: 'Updated' };
    const file = { originalname: 'cat.png' };

    categoryModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingCategory),
    });
    categoryModelMock.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(updatedCategory),
    });
    bunnyServiceMock.uploadFile.mockResolvedValue('new-image-url');

    await service.update('cat-1', { name: 'Updated' }, file as any);

    expect(categoryModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'cat-1',
      { name: 'Updated', image: 'new-image-url' },
      { new: true },
    );
    expect(bunnyServiceMock.deleteFile).toHaveBeenCalledWith('old-image-url');
    expect(bunnyServiceMock.deleteFile).not.toHaveBeenCalledWith('new-image-url');
  });
});
