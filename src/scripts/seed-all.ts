import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../app.module';
import { User, UserDocument } from '../user/schemas/user.schema';
import {
  Enrollment,
  EnrollmentDocument,
} from '../courses/schemas/enrollment.schema';
import {
  Bookmark,
  BookmarkDocument,
} from '../bookmarks/schemas/bookmark.schema';
import {
  Certificate,
  CertificateDocument,
} from '../certificate/schemas/certificate.schema';
import {
  Report,
  ReportDocument,
  ReportType,
} from '../reports/schemas/report.schema';
import { UserRole } from '../auth/enums/user-role.enum';
import { CourseSeedModels, seedCourseCatalog } from './seed-courses';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Chapter, ChapterDocument } from '../courses/schemas/chapter.schema';
import { Lesson, LessonDocument } from '../courses/schemas/lesson.schema';
import { Quiz, QuizDocument } from '../courses/schemas/quiz.schema';
import { Slide, SlideDocument } from '../slides/schemas/slide.schema';

interface SeedModels extends CourseSeedModels {
  userModel: Model<UserDocument>;
  enrollmentModel: Model<EnrollmentDocument>;
  bookmarkModel: Model<BookmarkDocument>;
  certificateModel: Model<CertificateDocument>;
  reportModel: Model<ReportDocument>;
}

function getSeedModels(
  app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>,
): SeedModels {
  return {
    userModel: app.get<Model<UserDocument>>(getModelToken(User.name)),
    enrollmentModel: app.get<Model<EnrollmentDocument>>(
      getModelToken(Enrollment.name),
    ),
    bookmarkModel: app.get<Model<BookmarkDocument>>(
      getModelToken(Bookmark.name),
    ),
    certificateModel: app.get<Model<CertificateDocument>>(
      getModelToken(Certificate.name),
    ),
    reportModel: app.get<Model<ReportDocument>>(getModelToken(Report.name)),
    categoryModel: app.get<Model<CategoryDocument>>(
      getModelToken(Category.name),
    ),
    courseModel: app.get<Model<CourseDocument>>(getModelToken(Course.name)),
    chapterModel: app.get<Model<ChapterDocument>>(getModelToken(Chapter.name)),
    lessonModel: app.get<Model<LessonDocument>>(getModelToken(Lesson.name)),
    quizModel: app.get<Model<QuizDocument>>(getModelToken(Quiz.name)),
    slideModel: app.get<Model<SlideDocument>>(getModelToken(Slide.name)),
  };
}

function createCertificateNumber(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CERT-${prefix}-${Date.now()}-${randomPart}`;
}

function calculateEnrollmentProgress(
  totalLessons: number,
  totalQuizzes: number,
  completedLessons: number,
  completedQuizzes: number,
) {
  const totalItems = totalLessons + totalQuizzes;
  if (totalItems === 0) {
    return 0;
  }

  return Math.round(
    ((completedLessons + completedQuizzes) / totalItems) * 100,
  );
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const models = getSeedModels(app);

    console.log('Starting full project seed...');

    console.log('Clearing user-related data...');
    await models.bookmarkModel.deleteMany({});
    await models.certificateModel.deleteMany({});
    await models.reportModel.deleteMany({});
    await models.enrollmentModel.deleteMany({});
    await models.userModel.deleteMany({});

    const catalog = await seedCourseCatalog(models);

    console.log('Creating users...');
    const sharedPassword = await bcrypt.hash('password123', 10);

    const [, studentOne, studentTwo, studentThree] =
      await models.userModel.create([
        {
          username: 'badihy_admin',
          fullName: 'Badihy Admin',
          email: 'admin@badihy.com',
          password: sharedPassword,
          phone: '01000000001',
          isVerified: true,
          role: UserRole.ADMIN,
          profileImage: 'https://example.com/users/admin.jpg',
        },
        {
          username: 'sara_ali',
          fullName: 'Sara Ali',
          email: 'sara.ali@badihy.com',
          password: sharedPassword,
          phone: '01000000002',
          isVerified: true,
          role: UserRole.USER,
          profileImage: 'https://example.com/users/sara.jpg',
        },
        {
          username: 'omar_hassan',
          fullName: 'Omar Hassan',
          email: 'omar.hassan@badihy.com',
          password: sharedPassword,
          phone: '01000000003',
          isVerified: true,
          role: UserRole.USER,
          profileImage: 'https://example.com/users/omar.jpg',
        },
        {
          username: 'nour_salem',
          fullName: 'Nour Salem',
          email: 'nour.salem@badihy.com',
          password: sharedPassword,
          phone: '01000000004',
          isVerified: false,
          role: UserRole.USER,
          profileImage: 'https://example.com/users/nour.jpg',
        },
      ]);

    console.log('Creating enrollments...');

    const jsCourse = catalog.courses.javaScriptEssentials;
    const reactCourse = catalog.courses.reactFundamentals;
    const saraReactCompletedLessons = reactCourse.lessons.slice(0, 3);
    const omarJsCompletedLessons = jsCourse.lessons.slice(0, 2);
    const nourReactCompletedLessons = reactCourse.lessons;

    const [saraJsEnrollment, , , nourReactEnrollment] =
      await models.enrollmentModel.create([
      {
        user: studentOne._id,
        course: jsCourse.course._id,
        completedLessons: jsCourse.lessons.map((lesson) => lesson._id),
        completedQuizzes: jsCourse.quizzes.map((quiz) => quiz._id),
        progress: calculateEnrollmentProgress(
          jsCourse.lessons.length,
          jsCourse.quizzes.length,
          jsCourse.lessons.length,
          jsCourse.quizzes.length,
        ),
        isCompleted: true,
        rating: 5,
        comment: 'Excellent course for beginners.',
      },
      {
        user: studentOne._id,
        course: reactCourse.course._id,
        completedLessons: saraReactCompletedLessons.map((lesson) => lesson._id),
        completedQuizzes: [],
        progress: calculateEnrollmentProgress(
          reactCourse.lessons.length,
          reactCourse.quizzes.length,
          saraReactCompletedLessons.length,
          0,
        ),
        isCompleted: false,
        rating: 4,
        comment: 'Great start, looking forward to the next lessons.',
      },
      {
        user: studentTwo._id,
        course: jsCourse.course._id,
        completedLessons: omarJsCompletedLessons.map((lesson) => lesson._id),
        completedQuizzes: [],
        progress: calculateEnrollmentProgress(
          jsCourse.lessons.length,
          jsCourse.quizzes.length,
          omarJsCompletedLessons.length,
          0,
        ),
        isCompleted: false,
        rating: 4,
        comment: 'The examples are very clear.',
      },
      {
        user: studentThree._id,
        course: reactCourse.course._id,
        completedLessons: nourReactCompletedLessons.map((lesson) => lesson._id),
        completedQuizzes: reactCourse.quizzes.map((quiz) => quiz._id),
        progress: calculateEnrollmentProgress(
          reactCourse.lessons.length,
          reactCourse.quizzes.length,
          nourReactCompletedLessons.length,
          reactCourse.quizzes.length,
        ),
        isCompleted: true,
        rating: 5,
        comment: 'The React walkthrough is practical and easy to follow.',
      },
    ]);

    await models.userModel.updateOne(
      { _id: studentOne._id },
      {
        $set: {
          enrolledCourses: [jsCourse.course._id, reactCourse.course._id],
        },
      },
    );
    await models.userModel.updateOne(
      { _id: studentTwo._id },
      {
        $set: {
          enrolledCourses: [jsCourse.course._id],
        },
      },
    );
    await models.userModel.updateOne(
      { _id: studentThree._id },
      {
        $set: {
          enrolledCourses: [reactCourse.course._id],
        },
      },
    );

    console.log('Creating bookmarks...');
    await models.bookmarkModel.create([
      { user: studentOne._id, course: reactCourse.course._id },
      { user: studentTwo._id, course: jsCourse.course._id },
      { user: studentTwo._id, course: reactCourse.course._id },
      { user: studentThree._id, course: jsCourse.course._id },
    ]);

    console.log('Creating certificates...');
    await models.certificateModel.create([
      {
        user: studentOne._id,
        course: jsCourse.course._id,
        certificateNumber: createCertificateNumber('JS'),
        issuedAt: new Date(),
        progressAtIssue: saraJsEnrollment.progress,
      },
      {
        user: studentThree._id,
        course: reactCourse.course._id,
        certificateNumber: createCertificateNumber('REACT'),
        issuedAt: new Date(),
        progressAtIssue: nourReactEnrollment.progress,
      },
    ]);

    console.log('Creating reports...');
    await models.reportModel.create([
      {
        userId: studentOne._id.toString(),
        name: studentOne.fullName,
        email: studentOne.email,
        subject: 'Lesson progress sync',
        message:
          'Progress should refresh faster after finishing the lesson on mobile.',
        type: ReportType.SUGGESTION,
      },
      {
        userId: studentTwo._id.toString(),
        name: studentTwo.fullName,
        email: studentTwo.email,
        subject: 'Video playback issue',
        message:
          'The lesson content loaded correctly, but the attached media took too long to appear.',
        type: ReportType.PROBLEM,
      },
      {
        name: 'Guest User',
        email: 'guest@example.com',
        subject: 'Feature request',
        message:
          'It would be helpful to add search and filtering to the course catalog.',
        type: ReportType.REPORT,
      },
    ]);

    console.log('Full project seed completed successfully.');
    console.log('Summary:');
    console.log(`- Categories: ${await models.categoryModel.countDocuments()}`);
    console.log(`- Courses: ${await models.courseModel.countDocuments()}`);
    console.log(`- Chapters: ${await models.chapterModel.countDocuments()}`);
    console.log(`- Lessons: ${await models.lessonModel.countDocuments()}`);
    console.log(`- Slides: ${await models.slideModel.countDocuments()}`);
    console.log(`- Quizzes: ${await models.quizModel.countDocuments()}`);
    console.log(`- Users: ${await models.userModel.countDocuments()}`);
    console.log(
      `- Enrollments: ${await models.enrollmentModel.countDocuments()}`,
    );
    console.log(`- Bookmarks: ${await models.bookmarkModel.countDocuments()}`);
    console.log(
      `- Certificates: ${await models.certificateModel.countDocuments()}`,
    );
    console.log(`- Reports: ${await models.reportModel.countDocuments()}`);
  } catch (error) {
    console.error('Full project seed failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
