import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model, Document } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Chapter, ChapterDocument } from '../courses/schemas/chapter.schema';
import { Lesson, LessonDocument } from '../courses/schemas/lesson.schema';
import { Quiz, QuizDocument } from '../courses/schemas/quiz.schema';
import { Slide, SlideDocument } from '../slides/schemas/slide.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { SlideType } from '../slides/types/slide-types.enum';
import { CourseLevel } from '../courses/types/course-level.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Use string literals that match the module registrations
  const courseModel = app.get<Model<CourseDocument>>(getModelToken('Course'));
  const chapterModel = app.get<Model<ChapterDocument>>(getModelToken('Chapter'));
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken('Lesson'));
  const quizModel = app.get<Model<QuizDocument>>(getModelToken('Quiz'));
  const slideModel = app.get<Model<SlideDocument>>(getModelToken('Slide')) as Model<SlideDocument>;
  const categoryModel = app.get<Model<CategoryDocument>>(getModelToken('Category'));

  console.log('🌱 Starting course seeding...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await courseModel.deleteMany({});
    await chapterModel.deleteMany({});
    await lessonModel.deleteMany({});
    await quizModel.deleteMany({});
    await slideModel.deleteMany({});

    // Create or find categories
    console.log('📁 Creating categories...');
    let programmingCategory = await categoryModel.findOne({ name: 'Programming' });
    if (!programmingCategory) {
      programmingCategory = await categoryModel.create({
        name: 'Programming',
        description: 'Learn programming languages and concepts',
      });
    }

    let webDevCategory = await categoryModel.findOne({ name: 'Web Development' });
    if (!webDevCategory) {
      webDevCategory = await categoryModel.create({
        name: 'Web Development',
        description: 'Build modern web applications',
      });
    }

    // Course 1: JavaScript Basics
    console.log('📚 Creating Course 1: JavaScript Basics...');
    const jsCourseData = {
      name: 'JavaScript Basics',
      description: 'Learn the fundamentals of JavaScript programming language',
      shortDescription: 'Master JavaScript from scratch and build your first interactive web applications',
      price: 49.99,
      category: programmingCategory._id,
      willLearn: [
        'Variables and Data Types',
        'Functions and Scope',
        'Arrays and Objects',
        'Control Flow',
        'DOM Manipulation'
      ],
      requirements: [
        'Basic computer skills',
        'Text editor (VS Code recommended)',
        'Web browser'
      ],
      targetAudience: [
        'Beginners',
        'Students',
        'Aspiring Developers',
        'Career Changers'
      ],
      level: CourseLevel.BEGINNER,
      estimationTime: '10 hours',
      coverImage: 'https://example.com/js-cover.jpg',
      thumbnailImage: 'https://example.com/js-thumb.jpg',
    };
    const jsCourse = await courseModel.create(jsCourseData);

    // Chapter 1: Introduction to JavaScript
    console.log('  📖 Creating Chapter 1: Introduction to JavaScript...');
    const jsChapter1Data = {
      title: 'Introduction to JavaScript',
      description: 'Get started with JavaScript basics',
      orderIndex: 1,
      course: jsCourse._id,
    };
    const jsChapter1 = await chapterModel.create(jsChapter1Data);

    // Lesson 1: Variables
    console.log('    📝 Creating Lesson 1: Variables...');
    const lesson1Data = {
      title: 'Variables and Data Types',
      description: 'Learn about variables and different data types in JavaScript',
      orderIndex: 1,
      chapter: jsChapter1._id,
      estimatedDuration: 20,
    };
    const lesson1 = await lessonModel.create(lesson1Data);

    // Slides for Lesson 1
    const slide1Data = {
      title: 'What are Variables?',
      type: SlideType.TEXT,
      textContent: 'Variables are containers for storing data values. In JavaScript, you can declare variables using var, let, or const.',
      orderIndex: 1,
      lesson: lesson1._id,
    };
    const slide1 = await (slideModel as any).create(slide1Data) as SlideDocument;

    const slide2Data = {
      title: 'Variable Declaration',
      type: SlideType.TEXT,
      textContent: 'let name = "John";\nconst age = 25;\nvar city = "New York";',
      orderIndex: 2,
      lesson: lesson1._id,
    };
    const slide2 = await (slideModel as any).create(slide2Data) as SlideDocument;

    const slide3Data = {
      title: 'Data Types',
      type: SlideType.GOLDEN_INFO,
      textContent: 'JavaScript has 7 primitive data types: String, Number, Boolean, Undefined, Null, Symbol, and BigInt.',
      orderIndex: 3,
      lesson: lesson1._id,
    };
    const slide3 = await (slideModel as any).create(slide3Data) as SlideDocument;

    const slide4Data = {
      title: 'Practice Question',
      type: SlideType.QUESTION,
      textContent: 'Which keyword is used to declare a constant variable?',
      questions: ['let', 'const', 'var', 'constant'],
      answer: 'const',
      questionHint: 'Think about variables that cannot be reassigned',
      orderIndex: 4,
      lesson: lesson1._id,
    };
    const slide4 = await (slideModel as any).create(slide4Data) as SlideDocument;

    // Update lesson with slides
    lesson1.slides = [(slide1 as any)._id, (slide2 as any)._id, (slide3 as any)._id, (slide4 as any)._id];
    await lesson1.save();

    // Lesson 2: Functions
    console.log('    📝 Creating Lesson 2: Functions...');
    const lesson2Data = {
      title: 'Functions',
      description: 'Learn how to create and use functions in JavaScript',
      orderIndex: 2,
      chapter: jsChapter1._id,
      estimatedDuration: 25,
    };
    const lesson2 = await lessonModel.create(lesson2Data);

    const slide5Data = {
      title: 'Function Declaration',
      type: SlideType.TEXT,
      textContent: 'Functions are reusable blocks of code. You can declare them using function keyword or arrow functions.',
      orderIndex: 1,
      lesson: lesson2._id,
    };
    const slide5 = await (slideModel as any).create(slide5Data) as SlideDocument;

    const slide6Data = {
      title: 'Function Examples',
      type: SlideType.TEXT,
      textContent: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconst greetArrow = (name) => `Hello, ${name}!`;',
      orderIndex: 2,
      lesson: lesson2._id,
    };
    const slide6 = await (slideModel as any).create(slide6Data) as SlideDocument;

    lesson2.slides = [(slide5 as any)._id, (slide6 as any)._id];
    await lesson2.save();

    // Update chapter with lessons
    jsChapter1.lessons = [lesson1._id, lesson2._id];
    await jsChapter1.save();

    // Chapter 2: Quiz
    console.log('  📖 Creating Chapter 2: Assessment Quiz...');
    const jsChapter2Data = {
      title: 'Chapter 1 Assessment',
      description: 'Test your knowledge of JavaScript basics',
      orderIndex: 2,
      course: jsCourse._id,
    };
    const jsChapter2 = await chapterModel.create(jsChapter2Data);

    const quiz1Data = {
      title: 'JavaScript Basics Quiz',
      description: 'Test your understanding of variables, data types, and functions',
      chapter: jsChapter2._id,
      questions: [
        {
          question: 'Which of the following is NOT a JavaScript data type?',
          options: ['String', 'Number', 'Character', 'Boolean'],
          correctAnswer: 2,
          explanation: 'JavaScript does not have a Character data type. Characters are represented as strings.',
          orderIndex: 1,
        },
        {
          question: 'What is the correct way to declare a constant variable?',
          options: ['var x = 5;', 'let x = 5;', 'const x = 5;', 'constant x = 5;'],
          correctAnswer: 2,
          explanation: 'The const keyword is used to declare constants in JavaScript.',
          orderIndex: 2,
        },
        {
          question: 'What does the following function return?\nfunction add(a, b) { return a + b; }',
          options: ['The sum of a and b', 'The product of a and b', 'The difference of a and b', 'An error'],
          correctAnswer: 0,
          explanation: 'The function returns the sum of the two parameters.',
          orderIndex: 3,
        },
      ],
      passingScore: 70,
      timeLimit: 15,
    };
    const quiz1 = await quizModel.create(quiz1Data);

    jsChapter2.quiz = quiz1._id;
    await jsChapter2.save();

    // Update course with chapters
    jsCourse.chapters = [jsChapter1._id, jsChapter2._id];
    await jsCourse.save();

    // Course 2: React Fundamentals
    console.log('📚 Creating Course 2: React Fundamentals...');
    const reactCourseData = {
      name: 'React Fundamentals',
      description: 'Master React.js and build modern user interfaces',
      shortDescription: 'Build dynamic and interactive web applications using React.js framework',
      price: 79.99,
      category: webDevCategory._id,
      willLearn: [
        'React Components',
        'JSX Syntax',
        'State Management',
        'Props and Events',
        'React Hooks'
      ],
      requirements: [
        'JavaScript basics',
        'HTML/CSS knowledge',
        'Node.js installed'
      ],
      targetAudience: [
        'Frontend Developers',
        'Web Developers',
        'JavaScript Developers',
        'UI/UX Developers'
      ],
      level: CourseLevel.INTERMEDIATE,
      estimationTime: '15 hours',
      coverImage: 'https://example.com/react-cover.jpg',
      thumbnailImage: 'https://example.com/react-thumb.jpg',
    };
    const reactCourse = await courseModel.create(reactCourseData);

    // Chapter 1: Getting Started with React
    console.log('  📖 Creating Chapter 1: Getting Started with React...');
    const reactChapter1Data = {
      title: 'Getting Started with React',
      description: 'Introduction to React and setting up your first project',
      orderIndex: 1,
      course: reactCourse._id,
    };
    const reactChapter1 = await chapterModel.create(reactChapter1Data);

    // Lesson 1: Introduction
    console.log('    📝 Creating Lesson 1: Introduction to React...');
    const reactLesson1Data = {
      title: 'What is React?',
      description: 'Learn what React is and why it\'s popular',
      orderIndex: 1,
      chapter: reactChapter1._id,
      estimatedDuration: 15,
    };
    const reactLesson1 = await lessonModel.create(reactLesson1Data);

    const reactSlide1Data = {
      title: 'React Overview',
      type: SlideType.TEXT,
      textContent: 'React is a JavaScript library for building user interfaces, particularly web applications.',
      orderIndex: 1,
      lesson: reactLesson1._id,
    };
    const reactSlide1 = await (slideModel as any).create(reactSlide1Data) as SlideDocument;

    const reactSlide2Data = {
      title: 'Why React?',
      type: SlideType.GOLDEN_INFO,
      textContent: 'React makes it easy to create interactive UIs with component-based architecture and virtual DOM.',
      orderIndex: 2,
      lesson: reactLesson1._id,
    };
    const reactSlide2 = await (slideModel as any).create(reactSlide2Data) as SlideDocument;

    reactLesson1.slides = [(reactSlide1 as any)._id, (reactSlide2 as any)._id];
    await reactLesson1.save();

    reactChapter1.lessons = [reactLesson1._id];
    await reactChapter1.save();

    reactCourse.chapters = [reactChapter1._id];
    await reactCourse.save();

    console.log('✅ Course seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${await courseModel.countDocuments()} courses`);
    console.log(`   - ${await chapterModel.countDocuments()} chapters`);
    console.log(`   - ${await lessonModel.countDocuments()} lessons`);
    console.log(`   - ${await slideModel.countDocuments()} slides`);
    console.log(`   - ${await quizModel.countDocuments()} quizzes`);

  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
