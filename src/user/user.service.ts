import { Injectable, forwardRef, Inject } from '@nestjs/common';
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
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
  ) { }

  /**
   * Creates a new user account and automatically logs them in.
   * - Generates a unique username from email
   * - Hashes the password
   * - Creates user with isVerified: false by default
   * - Generates verification token and sends welcome email with verification link
   * - Issues access + refresh tokens so the client is logged in immediately
   * @param createUserDto User creation data
   * @returns { token, refreshToken, user } — same shape as the login response
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
    const verificationToken = await this.generateVerificationToken(user._id.toString());
    await this.emailService.sendWelcomeEmail(user.email, user.fullName, verificationToken);

    // Auto-login: issue access & refresh tokens right after registration
    const tokens = await this.authService.getTokens(user._id, user.email);
    await this.authService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        fullName: user.fullName,
        firebaseUid: user.firebaseUid,
      },
    };
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

  async createFromFirebase(payload: { uid: string }) {
    const { uid } = payload;

    // Try linking to an existing account that already has this UID
    const existing = await this.findByFirebaseUid(uid);
    if (existing) return existing;

    // Generate a placeholder username; the user can update their profile later
    const username = 'user_' + Math.floor(Math.random() * 1000000);
    return await this.userModel.create({
      username,
      firebaseUid: uid,
      isVerified: true, // Firebase auth is already verified on the client side
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

  /**
   * Adds a course to the user's enrolledCourses array
   * @param userId User ID
   * @param courseId Course ID to push
   */
  async enrollInCourse(userId: string, courseId: string) {
    return await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { enrolledCourses: courseId } },
      { new: true }
    );
  }
}
