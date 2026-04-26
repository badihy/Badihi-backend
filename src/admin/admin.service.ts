import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly userService: UserService) {}

  listUsers(query: AdminUserQueryDto) {
    return this.userService.findUsersForAdmin(query);
  }

  getUserById(id: string) {
    return this.userService.findByIdForAdmin(id);
  }

  updateUser(id: string, dto: AdminUpdateUserDto) {
    return this.userService.adminUpdateUser(id, dto);
  }

  deleteUser(targetId: string, actorId: string) {
    return this.userService.removeAsAdmin(targetId, actorId);
  }
}
