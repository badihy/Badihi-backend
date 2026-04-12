import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@ApiTags('Bookmarks')
@ApiBearerAuth('JWT-access')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'إضافة دورة إلى المفضلة (قائمة الرغبات)' })
  add(@Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.add(dto.userId, dto.courseId);
  }

  @Delete(':userId/:courseId')
  @ApiOperation({ summary: 'إزالة دورة من المفضلة' })
  remove(@Param('userId') userId: string, @Param('courseId') courseId: string) {
    return this.bookmarksService.remove(userId, courseId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'جلب جميع الدورات المحفوظة في المفضلة لمستخدم' })
  findByUser(@Param('userId') userId: string) {
    return this.bookmarksService.findByUser(userId);
  }

  @Get('user/:userId/course/:courseId')
  @ApiOperation({ summary: 'التحقق مما إذا كانت الدورة في المفضلة' })
  isBookmarked(@Param('userId') userId: string, @Param('courseId') courseId: string) {
    return this.bookmarksService.isBookmarked(userId, courseId);
  }
}
