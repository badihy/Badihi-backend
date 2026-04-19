import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Categories')
@ApiBearerAuth('JWT-access')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileFieldsInterceptor([{
    name: 'image',
    maxCount: 1
  }]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new category' })
  create(@Body() createCategoryDto: CreateCategoryDto, @UploadedFiles() files: { image: Express.Multer.File[] }) {
    return this.categoriesService.create(createCategoryDto, files.image[0]);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileFieldsInterceptor([
    {
      name: 'image',
      maxCount: 1
    }
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a category' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @UploadedFiles() files: { image: Express.Multer.File[] }) {
    return this.categoriesService.update(id, updateCategoryDto, files.image?.[0]);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
