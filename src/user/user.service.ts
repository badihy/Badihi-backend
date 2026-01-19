import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,

  ) { }
  async create(createUserDto: CreateUserDto) {
    const username = createUserDto.email.split('@')[0] + Math.floor(Math.random() * 1000);
    const password = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userModel.create({
      ...createUserDto,
      username,
      password,
    });

    return user;
  }

  async findAll() {
    return await this.userModel.find();
  }

  async findOne(id: number) {
    return await this.userModel.findById(id);
  }

  async findOneByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
