import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Slides')
@ApiBearerAuth('JWT-access')
@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء شريحة جديدة وربطها بدرس' })
  create(@Body() createSlideDto: CreateSlideDto) {
    return this.slidesService.create(createSlideDto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب الشرائح (اختياري حسب lessonId)' })
  @ApiQuery({ name: 'lessonId', required: false, type: String })
  findAll(@Query('lessonId') lessonId?: string) {
    return this.slidesService.findAll(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب شريحة بواسطة المعرف' })
  findOne(@Param('id') id: string) {
    return this.slidesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تحديث شريحة بواسطة المعرف' })
  update(@Param('id') id: string, @Body() updateSlideDto: UpdateSlideDto) {
    return this.slidesService.update(id, updateSlideDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف شريحة بواسطة المعرف' })
  remove(@Param('id') id: string) {
    return this.slidesService.remove(id);
  }
}
