import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Injectable } from '@nestjs/common';
import { BunnyService } from '../common/services/bunny.service';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        private readonly bunnyService: BunnyService
    ) { }

    async create(createCategoryDto: CreateCategoryDto, file: Express.Multer.File): Promise<Category> {
        const imageUrl = file ? await this.bunnyService.uploadFile(file) : '';
        const createdCategory = new this.categoryModel({ ...createCategoryDto, image: imageUrl });
        return createdCategory.save();;
    }

    async findAll(): Promise<Category[]> {
        return this.categoryModel.find().populate('parent').exec();
    }

    async findOne(id: string): Promise<Category | null> {
        return this.categoryModel.findById(id).populate('parent').exec();
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto, file: Express.Multer.File): Promise<Category | null> {
        const existingCategory = await this.categoryModel.findById(id).exec();
        if (!existingCategory) {
            return null;
        }

        const updateData: Record<string, unknown> = { ...updateCategoryDto };
        let previousImageUrl: string | undefined;

        if (file) {
            updateData.image = await this.bunnyService.uploadFile(file);
            previousImageUrl = existingCategory.image;
        }

        const updatedCategory = await this.categoryModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();

        if (updatedCategory && previousImageUrl) {
            await this.bunnyService.deleteFile(previousImageUrl);
        }

        return updatedCategory;
    }

    async remove(id: string): Promise<Category | null> {
        const category = await this.categoryModel.findByIdAndDelete(id).exec();
        if (category?.image) {
            await this.bunnyService.deleteFile(category.image);
        }
        return category;
    }
}
