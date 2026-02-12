import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly emailService: EmailService,

  ) { }

  /**
   * Creates a new user account
   * - Generates a unique username from email
   * - Hashes the password
   * - Creates user with isVerified: false by default
   * - Generates verification token and sends welcome email with verification link
   * @param createUserDto User creation data
   * @returns Created user document
   */
  async create(createUserDto: CreateUserDto) {
    const username = createUserDto.email.split('@')[0] + Math.floor(Math.random() * 1000);
    const password = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userModel.create({
      ...createUserDto,
      username,
      password,
    });

    // Generate verification token and send welcome email with deep link
    const token = await this.generateVerificationToken(user._id.toString());
    await this.emailService.sendWelcomeEmail(user.email, user.fullName, token);

    return user;
  }

  async findAll() {
    return await this.userModel.find();
  }

  async findById(id: string) {
    return await this.userModel.findById(id);
  }

  async findOneByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async findByFirebaseUid(uid: string) {
    return await this.userModel.findOne({ firebaseUid: uid });
  }

  async createFromFirebase(payload: any) {
    const { email, name, uid, picture } = payload;
    // Try to find by email first to link accounts if possible, otherwise create new
    let user = await this.findOneByEmail(email);
    if (user) {
      user.firebaseUid = uid;
      if (!user.fullName && name) user.fullName = name;
      // if (!user.picture && picture) user.picture = picture; // If we had picture
      return await user.save();
    }

    const username = email.split('@')[0] + Math.floor(Math.random() * 10000); // Generate simple username
    return await this.userModel.create({
      email,
      username,
      fullName: name || 'No Name',
      firebaseUid: uid,
      isVerified: true, // Firebase emails are usually verified or handled by Firebase
      // password is optional now
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    return await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashedRefreshToken });
  }

  async updateResetToken(userId: string, token: string, expires: Date) {
    return await this.userModel.findByIdAndUpdate(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async findByResetToken(token: string) {
    return await this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
  }

  async updatePassword(userId: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  /**
   * Generates a verification token for email verification
   * Token expires in 24 hours
   * @param userId User ID to generate token for
   * @returns Generated verification token
   */
  async generateVerificationToken(userId: string) {
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 24 * 3600000); // 24 hours

    await this.userModel.findByIdAndUpdate(userId, {
      verificationToken: token,
      verificationTokenExpires: expires,
    });
    return token;
  }

  /**
   * Verifies user email using verification token
   * Sets isVerified to true and clears verification token fields
   * @param token Verification token from email link
   * @returns User document if verification successful, null otherwise
   */
  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) return null;

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    return await user.save();
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
