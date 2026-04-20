import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Chapter, ChapterDocument } from '../courses/schemas/chapter.schema';
import { Lesson, LessonDocument } from '../courses/schemas/lesson.schema';
import { Quiz, QuizDocument } from '../courses/schemas/quiz.schema';
import { Slide, SlideDocument } from '../slides/schemas/slide.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { SlideType } from '../slides/types/slide-types.enum';
import { CourseLevel } from '../courses/types/course-level.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const courseModel = app.get<Model<CourseDocument>>(getModelToken('Course'));
  const chapterModel = app.get<Model<ChapterDocument>>(
    getModelToken('Chapter'),
  );
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken('Lesson'));
  const quizModel = app.get<Model<QuizDocument>>(getModelToken('Quiz'));
  const slideModel = app.get<Model<SlideDocument>>(getModelToken('Slide'));
  const categoryModel = app.get<Model<CategoryDocument>>(
    getModelToken('Category'),
  );

  console.log('🌱 Starting course seed...');

  try {
    console.log('🗑️  Clearing existing course data...');
    await courseModel.deleteMany({});
    await chapterModel.deleteMany({});
    await lessonModel.deleteMany({});
    await quizModel.deleteMany({});
    await slideModel.deleteMany({});

    console.log('📁 Creating categories...');

    let programmingCategory = await categoryModel.findOne({
      name: 'Programming',
    });
    if (!programmingCategory) {
      programmingCategory = await categoryModel.create({
        name: 'Programming',
        description:
          'Learn programming languages and the core concepts required to build applications.',
        image: 'https://example.com/categories/programming.jpg',
      });
    }

    let webDevCategory = await categoryModel.findOne({
      name: 'Web Development',
    });
    if (!webDevCategory) {
      webDevCategory = await categoryModel.create({
        name: 'Web Development',
        description:
          'Build modern and interactive web applications using current technologies.',
        image: 'https://example.com/categories/webdev.jpg',
      });
    }

    console.log('📚 Creating course 1: JavaScript Essentials...');

    const jsCourse = await courseModel.create({
      name: 'JavaScript Essentials',
      description:
        'Learn JavaScript fundamentals from scratch through practical examples that help you build interactive web pages.',
      shortDescription:
        'Master JavaScript basics and build your first interactive web experiences.',
      price: 149,
      category: programmingCategory._id,
      willLearn: [
        'Variables and data types',
        'Functions and scope',
        'Arrays and objects',
        'Control flow with if, for, and while',
        'Working with the DOM and interactivity',
        'Async programming with async and await',
      ],
      requirements: [
        'Basic computer skills',
        'A code editor such as VS Code',
        'A modern web browser',
      ],
      targetAudience: [
        'Programming beginners',
        'University students',
        'Developers interested in frontend fundamentals',
        'Professionals exploring a career shift into software development',
      ],
      level: CourseLevel.BEGINNER,
      estimationTime: '10 hours',
      coverImage: 'https://example.com/courses/js-cover.jpg',
      thumbnailImage: 'https://example.com/courses/js-thumb.jpg',
    });

    console.log('  📖 Creating chapter 1: Introduction to JavaScript...');
    const jsChapter1 = await chapterModel.create({
      title: 'Introduction to JavaScript',
      subtitle:
        'Start your journey with one of the most popular languages on the web',
      description:
        'Discover what JavaScript is, where it came from, and how to write your first line of code.',
      orderIndex: 1,
      course: jsCourse._id,
    });

    console.log('    📝 Creating lesson 1: Variables and Data Types...');
    const jsLesson1 = await lessonModel.create({
      title: 'Variables and Data Types',
      description:
        'Learn how to declare variables and use common JavaScript data types.',
      orderIndex: 1,
      chapter: jsChapter1._id,
      estimatedDuration: 20,
    });

    const jsSlide1 = await slideModel.create({
      title: 'What is a variable?',
      type: SlideType.TEXT,
      textContent:
        'A variable is a container used to store data. In JavaScript, variables can be declared with var, let, or const.',
      orderIndex: 1,
      lesson: jsLesson1._id,
    });

    const jsSlide2 = await slideModel.create({
      title: 'The seven primitive data types',
      type: SlideType.GOLDEN_INFO,
      textContent:
        'JavaScript has seven primitive data types: String, Number, Boolean, Undefined, Null, Symbol, and BigInt.',
      orderIndex: 2,
      lesson: jsLesson1._id,
    });

    const jsSlide3 = await slideModel.create({
      title: 'Inspiring quote',
      type: SlideType.QUOTE,
      textContent:
        '"Everybody in this country should learn how to program a computer because it teaches you how to think." - Steve Jobs',
      orderIndex: 3,
      lesson: jsLesson1._id,
    });

    const jsSlide4 = await slideModel.create({
      title: 'Practice question',
      type: SlideType.QUESTION,
      textContent: 'Which keyword is used to declare a constant value?',
      questions: ['var', 'let', 'const', 'static'],
      answer: 'const',
      questionHint:
        'Think about the keyword used for values that should not be reassigned.',
      orderIndex: 4,
      lesson: jsLesson1._id,
    });

    jsLesson1.slides = [
      jsSlide1._id,
      jsSlide2._id,
      jsSlide3._id,
      jsSlide4._id,
    ] as any;
    await jsLesson1.save();

    console.log('    📝 Creating lesson 2: Functions...');
    const jsLesson2 = await lessonModel.create({
      title: 'Functions in JavaScript',
      description:
        'Learn how to define and call functions and how scope works.',
      orderIndex: 2,
      chapter: jsChapter1._id,
      estimatedDuration: 25,
    });

    const jsSlide5 = await slideModel.create({
      title: 'Defining a function',
      type: SlideType.TEXT,
      textContent:
        'A function is a reusable block of code. It can be written in more than one way:\n' +
        '1. function greet(name) { return `Hello, ${name}!`; }\n' +
        '2. const greet = (name) => `Hello, ${name}!`;',
      orderIndex: 1,
      lesson: jsLesson2._id,
    });

    const jsSlide6 = await slideModel.create({
      title: 'A golden rule for functions',
      type: SlideType.GOLDEN_INFO,
      textContent:
        'Write small focused functions. Each function should handle one clear responsibility.',
      orderIndex: 2,
      lesson: jsLesson2._id,
    });

    const jsSlide7 = await slideModel.create({
      title: 'Practice question: functions',
      type: SlideType.QUESTION,
      textContent:
        'What is the main difference between a function declaration and a function expression?',
      questions: [
        'There is no difference',
        'Declarations are hoisted while expressions are not',
        'Expressions are always faster',
        'Declarations cannot receive arguments',
      ],
      answer: 'Declarations are hoisted while expressions are not',
      questionHint: 'Think about hoisting in JavaScript.',
      orderIndex: 3,
      lesson: jsLesson2._id,
    });

    jsLesson2.slides = [jsSlide5._id, jsSlide6._id, jsSlide7._id] as any;
    await jsLesson2.save();

    jsChapter1.lessons = [jsLesson1._id, jsLesson2._id] as any;
    await jsChapter1.save();

    console.log('  📖 Creating chapter 2: Knowledge Check...');
    const jsChapter2 = await chapterModel.create({
      title: 'Chapter 1 Quiz',
      subtitle: 'Test your understanding of JavaScript fundamentals',
      description:
        'A short quiz covering variables, data types, and functions.',
      orderIndex: 2,
      course: jsCourse._id,
    });

    const jsQuiz = await quizModel.create({
      title: 'JavaScript Fundamentals Quiz',
      description:
        'Assess your understanding of variables, data types, and functions in JavaScript.',
      chapter: jsChapter2._id,
      questions: [
        {
          question: 'Which of the following is not a JavaScript data type?',
          options: ['String', 'Number', 'Character', 'Boolean'],
          correctAnswer: 2,
          explanation:
            'JavaScript does not have a dedicated Character type. Single characters are stored as strings.',
          orderIndex: 1,
        },
        {
          question: 'What is the result of typeof null in JavaScript?',
          options: ['"null"', '"undefined"', '"object"', '"boolean"'],
          correctAnswer: 2,
          explanation:
            'This is a historical quirk in JavaScript. typeof null returns "object" even though null is not an object.',
          orderIndex: 2,
        },
        {
          question: 'Which keyword creates a block-scoped variable?',
          options: ['var', 'let', 'function', 'global'],
          correctAnswer: 1,
          explanation:
            'let and const are block-scoped, while var is function-scoped or globally scoped.',
          orderIndex: 3,
        },
        {
          question: 'Which arrow function syntax is correct?',
          options: [
            'function(x) => x * 2',
            'const double = (x) => x * 2;',
            'arrow double(x) { return x * 2; }',
            '(x) -> x * 2',
          ],
          correctAnswer: 1,
          explanation:
            'Arrow functions use syntax such as const fn = (params) => expression;',
          orderIndex: 4,
        },
      ],
      passingScore: 75,
      timeLimit: 20,
    });

    jsChapter2.quiz = jsQuiz._id as any;
    await jsChapter2.save();

    jsCourse.chapters = [jsChapter1._id, jsChapter2._id] as any;
    await jsCourse.save();

    console.log('📚 Creating course 2: React.js Fundamentals...');

    const reactCourse = await courseModel.create({
      name: 'React.js Fundamentals',
      description:
        'Build a solid foundation in React.js by learning components, hooks, state management, and practical best practices.',
      shortDescription:
        'Create dynamic web interfaces with one of the most popular frontend libraries.',
      price: 249,
      category: webDevCategory._id,
      willLearn: [
        'The component model',
        'How JSX works',
        'Managing state with useState',
        'Handling events and props',
        'Core hooks such as useEffect and useContext',
        'Client-side routing with React Router',
      ],
      requirements: [
        'Comfort with JavaScript fundamentals (ES6+)',
        'Basic HTML and CSS knowledge',
        'Node.js installed on your machine',
      ],
      targetAudience: [
        'Frontend developers',
        'Full-stack web developers',
        'JavaScript developers learning React',
        'Designers interested in implementation',
      ],
      level: CourseLevel.INTERMEDIATE,
      estimationTime: '15 hours',
      coverImage: 'https://example.com/courses/react-cover.jpg',
      thumbnailImage: 'https://example.com/courses/react-thumb.jpg',
    });

    console.log('  📖 Creating chapter 1: Getting Started with React...');
    const reactChapter1 = await chapterModel.create({
      title: 'Getting Started with React',
      subtitle:
        'Understand the React mindset and how it differs from vanilla JavaScript',
      description:
        'An introduction to React, local setup, and your first project structure.',
      orderIndex: 1,
      course: reactCourse._id,
    });

    console.log('    📝 Creating lesson 1: What is React?');
    const reactLesson1 = await lessonModel.create({
      title: 'What is React and why is it useful?',
      description:
        'Understand what React is and why it became so popular in frontend development.',
      orderIndex: 1,
      chapter: reactChapter1._id,
      estimatedDuration: 15,
    });

    const reactSlide1 = await slideModel.create({
      title: 'React overview',
      type: SlideType.TEXT,
      textContent:
        'React is an open-source JavaScript library created by Meta for building user interfaces, especially single-page applications.',
      orderIndex: 1,
      lesson: reactLesson1._id,
    });

    const reactSlide2 = await slideModel.create({
      title: 'Why React?',
      type: SlideType.GOLDEN_INFO,
      textContent:
        'React uses a component-based model and the Virtual DOM to keep interfaces maintainable and efficient.',
      orderIndex: 2,
      lesson: reactLesson1._id,
    });

    const reactSlide3 = await slideModel.create({
      title: 'A quote from the React community',
      type: SlideType.QUOTE,
      textContent: '"Learn React once, write anywhere." - React Team',
      orderIndex: 3,
      lesson: reactLesson1._id,
    });

    const reactSlide4 = await slideModel.create({
      title: 'Question: what is the Virtual DOM?',
      type: SlideType.QUESTION,
      textContent: 'Which option best describes the Virtual DOM?',
      questions: [
        'A real browser DOM created by the browser',
        'A lightweight in-memory representation of the DOM managed by React',
        'A separate framework unrelated to React',
        'A database used to store application state',
      ],
      answer:
        'A lightweight in-memory representation of the DOM managed by React',
      questionHint: 'Think about how React optimizes updates.',
      orderIndex: 4,
      lesson: reactLesson1._id,
    });

    reactLesson1.slides = [
      reactSlide1._id,
      reactSlide2._id,
      reactSlide3._id,
      reactSlide4._id,
    ] as any;
    await reactLesson1.save();

    console.log('    📝 Creating lesson 2: Components and JSX...');
    const reactLesson2 = await lessonModel.create({
      title: 'Components and JSX',
      description: 'Learn how to create components and write JSX correctly.',
      orderIndex: 2,
      chapter: reactChapter1._id,
      estimatedDuration: 30,
    });

    const reactSlide5 = await slideModel.create({
      title: 'Your first component',
      type: SlideType.TEXT,
      textContent:
        'In React, a component is often a function that returns JSX:\n' +
        'function WelcomeCard() {\n' +
        '  return <div className="card">Welcome to React!</div>;\n' +
        '}',
      orderIndex: 1,
      lesson: reactLesson2._id,
    });

    const reactSlide6 = await slideModel.create({
      title: 'Visual example: profile card component',
      type: SlideType.TEXT,
      textContent:
        'Imagine a card component that receives a user name and avatar through props.',
      imageUrl: 'https://example.com/images/react-component-diagram.png',
      orderIndex: 2,
      lesson: reactLesson2._id,
    });

    const reactSlide7 = await slideModel.create({
      title: 'Question: JSX',
      type: SlideType.QUESTION,
      textContent: 'What makes JSX different from plain HTML?',
      questions: [
        'JSX uses class instead of className',
        'JSX allows embedding JavaScript expressions inside {}',
        'JSX does not support CSS',
        'There is no difference',
      ],
      answer: 'JSX allows embedding JavaScript expressions inside {}',
      questionHint: 'Think about curly braces in JSX.',
      orderIndex: 3,
      lesson: reactLesson2._id,
    });

    reactLesson2.slides = [
      reactSlide5._id,
      reactSlide6._id,
      reactSlide7._id,
    ] as any;
    await reactLesson2.save();

    reactChapter1.lessons = [reactLesson1._id, reactLesson2._id] as any;
    await reactChapter1.save();

    console.log('  📖 Creating chapter 2: React Fundamentals Quiz...');
    const reactChapter2 = await chapterModel.create({
      title: 'React Fundamentals Quiz',
      subtitle:
        'Check your understanding before moving to more advanced topics',
      description: 'A quiz covering components, JSX, and the Virtual DOM.',
      orderIndex: 2,
      course: reactCourse._id,
    });

    const reactQuiz = await quizModel.create({
      title: 'React.js Fundamentals Quiz',
      description:
        'Test your understanding of core React concepts such as components, JSX, and the Virtual DOM.',
      chapter: reactChapter2._id,
      questions: [
        {
          question: 'What is the Virtual DOM?',
          options: [
            'A lightweight in-memory copy of the browser DOM used to optimize updates',
            'An API for creating databases',
            'A tool for managing CSS in React',
            'A special built-in React component',
          ],
          correctAnswer: 0,
          explanation:
            'The Virtual DOM is a lightweight representation of the real DOM. React compares versions of it to update only what changed.',
          orderIndex: 1,
        },
        {
          question: 'Which attribute is used to assign CSS classes in JSX?',
          options: ['class', 'className', 'cssClass', 'styleClass'],
          correctAnswer: 1,
          explanation:
            'In JSX, className is used instead of class to avoid conflicting with the reserved JavaScript keyword class.',
          orderIndex: 2,
        },
        {
          question: 'Which hook is used to manage component state in React?',
          options: ['useEffect', 'useState', 'useContext', 'useReducer'],
          correctAnswer: 1,
          explanation:
            'useState is the core hook used to add state to functional components.',
          orderIndex: 3,
        },
        {
          question: 'What is a prop in React?',
          options: [
            'A private internal variable that cannot be passed out',
            'Data passed from a parent component to a child component',
            'A method used to query the database',
            'A built-in React hook',
          ],
          correctAnswer: 1,
          explanation:
            'Props, short for properties, are read-only values passed from parent components to child components.',
          orderIndex: 4,
        },
        {
          question: 'What should a React component return?',
          options: [
            'A JSON string',
            'A JSX element or null',
            'Any plain JavaScript object',
            'A separate HTML file',
          ],
          correctAnswer: 1,
          explanation:
            'A functional React component should return a JSX element or null.',
          orderIndex: 5,
        },
      ],
      passingScore: 70,
      timeLimit: 25,
    });

    reactChapter2.quiz = reactQuiz._id as any;
    await reactChapter2.save();

    reactCourse.chapters = [reactChapter1._id, reactChapter2._id] as any;
    await reactCourse.save();

    console.log('\n✅ Course seed completed successfully.\n');
    console.log('📊 Summary:');
    console.log(`   - Courses   : ${await courseModel.countDocuments()}`);
    console.log(`   - Chapters  : ${await chapterModel.countDocuments()}`);
    console.log(`   - Lessons   : ${await lessonModel.countDocuments()}`);
    console.log(`   - Slides    : ${await slideModel.countDocuments()}`);
    console.log(`   - Quizzes   : ${await quizModel.countDocuments()}`);
  } catch (error) {
    console.error('❌ Course seed failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
