import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Quizzes')
@ApiBearerAuth('JWT-access')
@Controller('courses/quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Create a new quiz inside a chapter (chapter must have no lessons)',
  })
  createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.createQuiz(createQuizDto);
  }

  @Get('by-chapter/:chapterId')
  @ApiOperation({ summary: 'Get the quiz for a specific chapter' })
  findQuizByChapter(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.quizzesService.findQuizByChapter(
      chapterId,
      role === UserRole.ADMIN ? undefined : userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single quiz by ID' })
  findOneQuiz(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.quizzesService.findOneQuiz(
      id,
      role === UserRole.ADMIN ? undefined : userId,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a quiz by ID' })
  updateQuiz(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateQuizDto>,
  ) {
    return this.quizzesService.updateQuiz(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a quiz and unlink it from its chapter' })
  removeQuiz(@Param('id') id: string) {
    return this.quizzesService.removeQuiz(id);
  }
}
