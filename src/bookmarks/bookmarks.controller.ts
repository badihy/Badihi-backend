import { Body, Controller, Delete, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Bookmarks')
@ApiBearerAuth('JWT-access')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'إضافة دورة إلى المفضلة (قائمة الرغبات)' })
  add(@Body() dto: CreateBookmarkDto, @CurrentUser('id') userId: string) {
    return this.bookmarksService.add(userId, dto.courseId);
  }

  @Delete(':userId/:courseId')
  @ApiOperation({ summary: 'إزالة دورة من المفضلة' })
  remove(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    this.ensureOwnUserScope(userId, currentUserId);
    return this.bookmarksService.remove(userId, courseId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'جلب جميع الدورات المحفوظة في المفضلة لمستخدم' })
  findByUser(@Param('userId') userId: string, @CurrentUser('id') currentUserId: string) {
    this.ensureOwnUserScope(userId, currentUserId);
    return this.bookmarksService.findByUser(userId);
  }

  @Get('user/:userId/course/:courseId')
  @ApiOperation({ summary: 'التحقق مما إذا كانت الدورة في المفضلة' })
  isBookmarked(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    this.ensureOwnUserScope(userId, currentUserId);
    return this.bookmarksService.isBookmarked(userId, courseId);
  }

  private ensureOwnUserScope(userId: string, currentUserId: string) {
    if (!currentUserId || userId !== currentUserId) {
      throw new ForbiddenException('لا يمكنك الوصول إلى بيانات مستخدم آخر');
    }
  }
}
