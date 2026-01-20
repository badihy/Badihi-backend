import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'src/common/services/email.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), JwtModule],
  controllers: [UserController],
  providers: [UserService, EmailService],
  exports: [UserService]
})
export class UserModule { }
