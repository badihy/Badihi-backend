import { BadRequestException, ConflictException, Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
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
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { BunnyService } from '../common/services/bunny.service';
import { Enrollment, EnrollmentDocument } from '../courses/schemas/enrollment.schema';
import { Report, ReportDocument } from '../reports/schemas/report.schema';
import { Certificate, CertificateDocument } from '../certificate/schemas/certificate.schema';
import { Bookmark, BookmarkDocument } from '../bookmarks/schemas/bookmark.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Certificate.name) private readonly certificateModel: Model<CertificateDocument>,
    @InjectModel(Bookmark.name) private readonly bookmarkModel: Model<BookmarkDocument>,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    private readonly bunnyService: BunnyService,
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
  async create(createUserDto: CreateUserDto, file?: Express.Multer.File) {
    const username = createUserDto.email.split('@')[0] + Math.floor(Math.random() * 1000);
    const password = await bcrypt.hash(createUserDto.password, 10);
    const profileImage = file ? await this.bunnyService.uploadFile(file) : undefined;
    const user = await this.userModel.create({
      ...createUserDto,
      profileImage: profileImage,
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
        profileImage: user.profileImage,
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

  async createFromFirebase(payload: { uid: string; email?: string; fullName?: string; profileImage?: string }) {
    const { uid, email, fullName, profileImage } = payload;

    // Try linking to an existing account that already has this UID
    const existing = await this.findByFirebaseUid(uid);
    if (existing) return existing;

    const fallbackEmail = `${uid}@firebase.local`;
    const safeEmail = email || fallbackEmail;
    const safeFullName = fullName || 'Google User';
    const username = await this.generateUniqueUsername(safeEmail, safeFullName);

    return await this.userModel.create({
      username,
      email: safeEmail,
      fullName: safeFullName,
      profileImage,
      firebaseUid: uid,
      isVerified: true, // Firebase auth is already verified on the client side
    });
  }

  async linkFirebaseUid(userId: string, uid: string) {
    return await this.userModel.findByIdAndUpdate(userId, { firebaseUid: uid }, { new: true });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.username) {
      await this.ensureUsernameAvailable(updateUserDto.username, id);
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    if (!updatedUser) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return updatedUser;
  }

  async updateUsername(id: string, updateUsernameDto: UpdateUsernameDto) {
    await this.ensureUsernameAvailable(updateUsernameDto.username, id);
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { username: updateUsernameDto.username },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return updatedUser;
  }

  async updateProfileImage(id: string, updateProfileImageDto: UpdateProfileImageDto, file?: Express.Multer.File) : Promise<UserDocument> {
    if (!file) {
      throw new BadRequestException('صورة الملف الشخصي مطلوبة');
    }
    const profileImage = await this.bunnyService.uploadFile(file);
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { profileImage: profileImage },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return updatedUser;
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

  async findOrCreateGoogleUser(payload: {
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }) {
    let user = await this.findOneByEmail(payload.email);
    if (user) return user;
    const fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'Google User';
    const username = await this.generateUniqueUsername(payload.email, fullName);
    return await this.userModel.create({
      email: payload.email,
      fullName,
      username,
      profileImage: payload.picture,
      isVerified: true,
    });
  }

  async remove(id: string) {
    // Clean up related entities owned by this user
    await this.enrollmentModel.deleteMany({ user: id });
    await this.bookmarkModel.deleteMany({ user: id });
    await this.reportModel.deleteMany({ userId: id });
    await this.certificateModel.deleteMany({ user: id });

    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return { message: 'تم حذف المستخدم بنجاح' };
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

  private async ensureUsernameAvailable(username: string, currentUserId: string) {
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser && existingUser._id.toString() !== currentUserId) {
      throw new ConflictException('اسم المستخدم مستخدم بالفعل');
    }
  }

  private async generateUniqueUsername(email?: string, fullName?: string) {
    const base = (email?.split('@')[0] || fullName || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'user';

    for (let i = 0; i < 10; i++) {
      const candidate = `${base}${Math.floor(Math.random() * 1000)}`;
      const existingUser = await this.userModel.findOne({ username: candidate });
      if (!existingUser) return candidate;
    }

    return `user_${Date.now()}`;
  }
}
