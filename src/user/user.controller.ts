import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }


  @ApiOperation({ summary: 'Create a new user' })
  @ApiConsumes('multipart/form-data') @UseInterceptors(FileFieldsInterceptor([{
    name: 'profileImage',
    maxCount: 1
  }]))
  @Post()
  async create(@Body() createUserDto: CreateUserDto, @UploadedFiles() files: { profileImage: Express.Multer.File[] }) {
    return await this.userService.create(createUserDto, files.profileImage[0]);
  }

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/username')
  updateUsername(@Param('id') id: string, @Body() updateUsernameDto: UpdateUsernameDto) {
    return this.userService.updateUsername(id, updateUsernameDto);
  }

  @Patch(':id/profile-image')
  @UseInterceptors(FileFieldsInterceptor([{
    name: 'profileImage',
    maxCount: 1
  }]))
  @ApiConsumes('multipart/form-data')
  updateProfileImage(@Param('id') id: string, @Body() updateProfileImageDto: UpdateProfileImageDto, @UploadedFiles() files: { profileImage: Express.Multer.File[] }) {
    return this.userService.updateProfileImage(id, updateProfileImageDto, files.profileImage[0]);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
