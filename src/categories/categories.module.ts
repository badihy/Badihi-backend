import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CategorySchema } from './schemas/category.schema';
import { BunnyService } from '../common/services/bunny.service';
import { PaginationProvider } from '../common/providers/pagination.provider';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Category', schema: CategorySchema }])],
  controllers: [CategoriesController],
  providers: [CategoriesService, BunnyService, PaginationProvider],
  exports: [MongooseModule], // Export MongooseModule so Category model can be used in other modules/scripts
})
export class CategoriesModule { }
