import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoriesService {
    constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        const createdCategory = new this.categoryModel(createCategoryDto);
        return createdCategory.save();
    }

    async findAll(): Promise<Category[]> {
        return this.categoryModel.find().populate('parent').exec();
    }

    async findOne(id: string): Promise<Category | null> {
        return this.categoryModel.findById(id).populate('parent').exec();
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
        return this.categoryModel.findByIdAndUpdate(id, updateCategoryDto, { new: true }).exec();
    }

    async remove(id: string): Promise<Category | null> {
        return this.categoryModel.findByIdAndDelete(id).exec();
    }
}
