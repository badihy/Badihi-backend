import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Chapters')
@ApiBearerAuth('JWT-access')
@Controller('courses/chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new chapter inside a course' })
  createChapter(@Body() createChapterDto: CreateChapterDto) {
    return this.chaptersService.createChapter(createChapterDto);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Get all chapters for a specific course' })
  findAllChapters(@Param('courseId') courseId: string) {
    return this.chaptersService.findAllChapters(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single chapter by ID' })
  findOneChapter(@Param('id') id: string) {
    return this.chaptersService.findOneChapter(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a chapter by ID' })
  updateChapter(@Param('id') id: string, @Body() updateData: UpdateChapterDto) {
    return this.chaptersService.updateChapter(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a chapter (cascades to lessons and quiz)' })
  removeChapter(@Param('id') id: string) {
    return this.chaptersService.removeChapter(id);
  }
}
