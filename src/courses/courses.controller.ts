import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto, PopulateLevel } from './dto/course-query.dto';
import { ApiConsumes, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  // ─── Course Endpoints ────────────────────────────────────────────────────────

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'coverImage', maxCount: 1 },
    { name: 'thumbnailImage', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Create a new course' })
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFiles() files: { coverImage: Express.Multer.File[], thumbnailImage: Express.Multer.File[] },
  ) {
    return this.coursesService.create(createCourseDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses with full population' })
  @ApiQuery({ name: 'category', type: String, required: false, description: 'Filter by category ID' })
  async findAll(@Query('category') categoryId?: string) {
    return await this.coursesService.findAll(PopulateLevel.FULL, true, categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by id with flexible population' })
  @ApiQuery({ name: 'populate', enum: PopulateLevel, required: false, description: 'Level of nested population' })
  @ApiQuery({ name: 'includeCategory', type: Boolean, required: false, description: 'Include category information' })
  async findOne(
    @Param('id') id: string,
    @Query() query: CourseQueryDto,
  ) {
    const populateLevel = query.populate || PopulateLevel.FULL;
    const includeCategory = query.includeCategory !== undefined ? query.includeCategory : true;
    return await this.coursesService.findOne(id, populateLevel, includeCategory);
  }

  @Get(':id/chapters')
  @ApiOperation({ summary: 'Get a course with chapters only' })
  async findOneWithChapters(@Param('id') id: string) {
    return await this.coursesService.findOneWithChapters(id);
  }

  @Get(':id/chapters/lessons')
  @ApiOperation({ summary: 'Get a course with chapters and lessons' })
  async findOneWithLessons(@Param('id') id: string) {
    return await this.coursesService.findOneWithLessons(id);
  }

  @Get(':id/chapters/lessons/slides')
  @ApiOperation({ summary: 'Get a course with chapters, lessons, and slides' })
  async findOneWithSlides(@Param('id') id: string) {
    return await this.coursesService.findOneWithSlides(id);
  }

  @Get(':id/chapters/quizzes')
  @ApiOperation({ summary: 'Get a course with chapters and quizzes' })
  async findOneWithQuizzes(@Param('id') id: string) {
    return await this.coursesService.findOneWithQuizzes(id);
  }

  @Get(':id/full')
  @ApiOperation({ summary: 'Get a course with everything populated (chapters, lessons, slides, quizzes)' })
  async findOneFull(@Param('id') id: string) {
    return await this.coursesService.findOneFull(id);
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cover', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Update a course' })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFiles() files?: { cover?: Express.Multer.File[], thumbnail?: Express.Multer.File[] },
  ) {
    return this.coursesService.update(id, updateCourseDto, files);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

}
