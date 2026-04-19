import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Lessons')
@ApiBearerAuth('JWT-access')
@Controller('courses/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new lesson inside a chapter' })
  createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.createLesson(createLessonDto);
  }

  @Get('by-chapter/:chapterId')
  @ApiOperation({ summary: 'Get all lessons for a specific chapter' })
  findAllLessons(@Param('chapterId') chapterId: string) {
    return this.lessonsService.findAllLessons(chapterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single lesson by ID' })
  findOneLesson(@Param('id') id: string) {
    return this.lessonsService.findOneLesson(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a lesson by ID' })
  updateLesson(@Param('id') id: string, @Body() updateData: Partial<CreateLessonDto>) {
    return this.lessonsService.updateLesson(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a lesson and remove it from its chapter' })
  removeLesson(@Param('id') id: string) {
    return this.lessonsService.removeLesson(id);
  }
}
