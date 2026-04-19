import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiBearerAuth('JWT-access')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }


  @Public()
  @ApiOperation({ summary: 'Create a new user', security: [] })
  @ApiConsumes('multipart/form-data') @UseInterceptors(FileFieldsInterceptor([{
    name: 'profileImage',
    maxCount: 1
  }]))
  @Post()
  async create(@Body() createUserDto: CreateUserDto, @UploadedFiles() files: { profileImage: Express.Multer.File[] }) {
    return await this.userService.create(createUserDto, files?.profileImage?.[0]);
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return await this.userService.findById(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return await this.userService.findById(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    this.ensureOwnUserScope(id, currentUserId);
    return this.userService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    this.ensureOwnUserScope(id, currentUserId);
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/username')
  updateUsername(
    @Param('id') id: string,
    @Body() updateUsernameDto: UpdateUsernameDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    this.ensureOwnUserScope(id, currentUserId);
    return this.userService.updateUsername(id, updateUsernameDto);
  }

  @Patch(':id/profile-image')
  @UseInterceptors(FileFieldsInterceptor([{
    name: 'profileImage',
    maxCount: 1
  }]))
  @ApiConsumes('multipart/form-data')
  updateProfileImage(
    @Param('id') id: string,
    @Body() updateProfileImageDto: UpdateProfileImageDto,
    @UploadedFiles() files: { profileImage: Express.Multer.File[] },
    @CurrentUser('id') currentUserId: string,
  ) {
    this.ensureOwnUserScope(id, currentUserId);
    return this.userService.updateProfileImage(id, updateProfileImageDto, files?.profileImage?.[0]);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    this.ensureOwnUserScope(id, currentUserId);
    return this.userService.remove(id);
  }

  private ensureOwnUserScope(userId: string, currentUserId: string) {
    if (!currentUserId || userId !== currentUserId) {
      throw new ForbiddenException('لا يمكنك الوصول إلى بيانات مستخدم آخر');
    }
  }
}
