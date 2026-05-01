import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../auth/enums/user-role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@ApiTags('Admin')
@ApiBearerAuth('JWT-access')
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List users (paginated, searchable)' })
  listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user by id (sensitive fields omitted)' })
  @ApiParam({ name: 'id', description: 'User id (Mongo ObjectId)' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @ApiOperation({
    summary: 'Update user (role, verification, profile fields)',
    description:
      'Cannot remove the last admin or demote yourself when you are the only admin.',
  })
  @ApiParam({ name: 'id', description: 'User id' })
  updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @ApiOperation({
    summary: 'Delete a user and related enrollments, bookmarks, reports, certificates',
    description:
      'Cannot delete your own account from the admin panel or delete the last admin.',
  })
  @ApiParam({ name: 'id', description: 'User id' })
  deleteUser(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.deleteUser(id, actorId);
  }
}
