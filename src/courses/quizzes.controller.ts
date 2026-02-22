import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Quizzes')
@Controller('courses/quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quiz inside a chapter (chapter must have no lessons)' })
  createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.createQuiz(createQuizDto);
  }

  @Get('by-chapter/:chapterId')
  @ApiOperation({ summary: 'Get the quiz for a specific chapter' })
  findQuizByChapter(@Param('chapterId') chapterId: string) {
    return this.quizzesService.findQuizByChapter(chapterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single quiz by ID' })
  findOneQuiz(@Param('id') id: string) {
    return this.quizzesService.findOneQuiz(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quiz by ID' })
  updateQuiz(@Param('id') id: string, @Body() updateData: Partial<CreateQuizDto>) {
    return this.quizzesService.updateQuiz(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quiz and unlink it from its chapter' })
  removeQuiz(@Param('id') id: string) {
    return this.quizzesService.removeQuiz(id);
  }
}
