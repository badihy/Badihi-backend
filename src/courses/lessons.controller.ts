import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLockStatusDto } from './dto/update-lock-status.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
  findAllLessons(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.lessonsService.findAllLessons(
      chapterId,
      role === UserRole.ADMIN ? undefined : userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single lesson by ID' })
  findOneLesson(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.lessonsService.findOneLesson(
      id,
      role === UserRole.ADMIN ? undefined : userId,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a lesson by ID' })
  updateLesson(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateLessonDto>,
  ) {
    return this.lessonsService.updateLesson(id, updateData);
  }

  @Patch(':id/lock')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update lesson locked status' })
  updateLessonLock(
    @Param('id') id: string,
    @Body() updateLockStatusDto: UpdateLockStatusDto,
  ) {
    return this.lessonsService.updateLessonLock(id, updateLockStatusDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a lesson and remove it from its chapter' })
  removeLesson(@Param('id') id: string) {
    return this.lessonsService.removeLesson(id);
  }
}
