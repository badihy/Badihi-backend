import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { Chapter, ChapterDocument } from '../courses/schemas/chapter.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Lesson, LessonDocument } from '../courses/schemas/lesson.schema';
import { Quiz, QuizDocument } from '../courses/schemas/quiz.schema';
import { Slide, SlideDocument } from '../slides/schemas/slide.schema';
import { CourseLevel } from '../courses/types/course-level.enum';
import { SlideType } from '../slides/types/slide-types.enum';

export interface CourseSeedModels {
  courseModel: Model<CourseDocument>;
  chapterModel: Model<ChapterDocument>;
  lessonModel: Model<LessonDocument>;
  quizModel: Model<QuizDocument>;
  slideModel: Model<SlideDocument>;
  categoryModel: Model<CategoryDocument>;
}

export interface SeededCourseRecord {
  course: CourseDocument;
  lessons: LessonDocument[];
  quizzes: QuizDocument[];
}

export interface SeededCourseCatalog {
  categories: {
    programming: CategoryDocument;
    webDevelopment: CategoryDocument;
  };
  courses: {
    javaScriptEssentials: SeededCourseRecord;
    reactFundamentals: SeededCourseRecord;
  };
}

type SlideSeed = {
  title: string;
  type: SlideType;
  textContent?: string;
  imageUrl?: string;
  questions?: string[];
  answer?: string;
  questionHint?: string;
};

type LessonSeed = {
  title: string;
  description: string;
  estimatedDuration: number;
  slides: SlideSeed[];
};

type LearningChapterSeed = {
  title: string;
  subtitle: string;
  description: string;
  lessons: LessonSeed[];
};

type QuizQuestionSeed = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type QuizChapterSeed = {
  title: string;
  subtitle: string;
  description: string;
  quiz: {
    title: string;
    description: string;
    passingScore: number;
    timeLimit: number;
    questions: QuizQuestionSeed[];
  };
};

type CourseSeedDefinition = {
  key: keyof SeededCourseCatalog['courses'];
  course: {
    name: string;
    description: string;
    shortDescription: string;
    price: number;
    willLearn: string[];
    requirements: string[];
    targetAudience: string[];
    level: CourseLevel;
    estimationTime: string;
    coverImage: string;
    thumbnailImage: string;
  };
  learningChapters: LearningChapterSeed[];
  quizChapter: QuizChapterSeed;
};

async function createLessonWithSlides(
  lessonModel: Model<LessonDocument>,
  slideModel: Model<SlideDocument>,
  chapterId: any,
  lessonSeed: LessonSeed,
  lessonOrderIndex: number,
): Promise<LessonDocument> {
  const lesson = await lessonModel.create({
    title: lessonSeed.title,
    description: lessonSeed.description,
    orderIndex: lessonOrderIndex,
    chapter: chapterId,
    estimatedDuration: lessonSeed.estimatedDuration,
  });

  const slides: SlideDocument[] = [];
  for (const [slideIndex, slideSeed] of lessonSeed.slides.entries()) {
    const slide = await slideModel.create({
      title: slideSeed.title,
      type: slideSeed.type,
      textContent: slideSeed.textContent,
      imageUrl: slideSeed.imageUrl,
      questions: slideSeed.questions,
      answer: slideSeed.answer,
      questionHint: slideSeed.questionHint,
      orderIndex: slideIndex + 1,
      lesson: lesson._id,
    });

    slides.push(slide);
  }

  lesson.slides = slides.map((slide) => slide._id) as any;
  await lesson.save();

  return lesson;
}

async function createLearningChapter(
  chapterModel: Model<ChapterDocument>,
  lessonModel: Model<LessonDocument>,
  slideModel: Model<SlideDocument>,
  courseId: any,
  chapterSeed: LearningChapterSeed,
  chapterOrderIndex: number,
): Promise<{ chapter: ChapterDocument; lessons: LessonDocument[] }> {
  const chapter = await chapterModel.create({
    title: chapterSeed.title,
    subtitle: chapterSeed.subtitle,
    description: chapterSeed.description,
    orderIndex: chapterOrderIndex,
    course: courseId,
  });

  const lessons: LessonDocument[] = [];
  for (const [lessonIndex, lessonSeed] of chapterSeed.lessons.entries()) {
    const lesson = await createLessonWithSlides(
      lessonModel,
      slideModel,
      chapter._id,
      lessonSeed,
      lessonIndex + 1,
    );
    lessons.push(lesson);
  }

  chapter.lessons = lessons.map((lesson) => lesson._id) as any;
  await chapter.save();

  return { chapter, lessons };
}

async function createQuizChapter(
  chapterModel: Model<ChapterDocument>,
  quizModel: Model<QuizDocument>,
  courseId: any,
  quizChapterSeed: QuizChapterSeed,
  chapterOrderIndex: number,
): Promise<{ chapter: ChapterDocument; quiz: QuizDocument }> {
  const chapter = await chapterModel.create({
    title: quizChapterSeed.title,
    subtitle: quizChapterSeed.subtitle,
    description: quizChapterSeed.description,
    orderIndex: chapterOrderIndex,
    course: courseId,
  });

  const quiz = await quizModel.create({
    title: quizChapterSeed.quiz.title,
    description: quizChapterSeed.quiz.description,
    chapter: chapter._id,
    questions: quizChapterSeed.quiz.questions.map((question, index) => ({
      ...question,
      orderIndex: index + 1,
    })),
    passingScore: quizChapterSeed.quiz.passingScore,
    timeLimit: quizChapterSeed.quiz.timeLimit,
  });

  chapter.quiz = quiz._id as any;
  await chapter.save();

  return { chapter, quiz };
}

async function createCourseFromSeed(
  models: CourseSeedModels,
  categoryId: any,
  seed: CourseSeedDefinition,
): Promise<SeededCourseRecord> {
  const {
    courseModel,
    chapterModel,
    lessonModel,
    quizModel,
    slideModel,
  } = models;

  const course = await courseModel.create({
    ...seed.course,
    category: categoryId,
  });

  const chapters: ChapterDocument[] = [];
  const lessons: LessonDocument[] = [];
  const quizzes: QuizDocument[] = [];

  for (const [chapterIndex, chapterSeed] of seed.learningChapters.entries()) {
    const result = await createLearningChapter(
      chapterModel,
      lessonModel,
      slideModel,
      course._id,
      chapterSeed,
      chapterIndex + 1,
    );

    chapters.push(result.chapter);
    lessons.push(...result.lessons);
  }

  const quizResult = await createQuizChapter(
    chapterModel,
    quizModel,
    course._id,
    seed.quizChapter,
    seed.learningChapters.length + 1,
  );

  chapters.push(quizResult.chapter);
  quizzes.push(quizResult.quiz);

  course.chapters = chapters.map((chapter) => chapter._id) as any;
  await course.save();

  return { course, lessons, quizzes };
}

const javaScriptCourseSeed: CourseSeedDefinition = {
  key: 'javaScriptEssentials',
  course: {
    name: 'JavaScript Essentials',
    description:
      'Learn JavaScript from first principles through realistic frontend scenarios, mini coding exercises, and browser-focused examples.',
    shortDescription:
      'A richer JavaScript path covering syntax, logic, data structures, DOM work, and async programming.',
    price: 149,
    willLearn: [
      'How JavaScript executes in the browser and how to write clean syntax',
      'The difference between primitive values, arrays, and objects',
      'How to organize reusable code with functions and predictable scope',
      'How to make pages interactive through DOM updates and event handling',
      'How promises, fetch, and async or await work in everyday apps',
      'How to debug common beginner mistakes with clear mental models',
    ],
    requirements: [
      'Basic computer and browser usage',
      'A code editor such as VS Code',
      'A modern browser with developer tools',
      'Willingness to practice by typing code, not just reading it',
    ],
    targetAudience: [
      'Absolute beginners in programming',
      'Students learning web development fundamentals',
      'Self-taught learners who want structure',
      'Junior developers who need a practical refresh',
    ],
    level: CourseLevel.BEGINNER,
    estimationTime: '18 hours',
    coverImage: 'https://example.com/courses/javascript-essentials-cover.jpg',
    thumbnailImage:
      'https://example.com/courses/javascript-essentials-thumb.jpg',
  },
  learningChapters: [
    {
      title: 'JavaScript Foundations',
      subtitle:
        'Build the mental model of how JavaScript stores and evaluates values',
      description:
        'This chapter introduces the language itself, how values are stored, and how decisions are made in code.',
      lessons: [
        {
          title: 'Variables, values, and data types',
          description:
            'Start with declarations, naming, primitive values, and how JavaScript stores information.',
          estimatedDuration: 24,
          slides: [
            {
              title: 'Why variables matter',
              type: SlideType.TEXT,
              textContent:
                'A variable lets you label a piece of information so the program can reuse it later. Think of it as a named reference to a value such as a number, string, or object.',
            },
            {
              title: 'let, const, and when to use each one',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'Use const by default. Switch to let only when the variable must be reassigned. This simple habit makes code easier to reason about and prevents accidental changes.',
            },
            {
              title: 'Primitive values you will use daily',
              type: SlideType.TEXT,
              textContent:
                'The most common primitive values are string, number, boolean, undefined, and null. Strings hold text, numbers hold numeric values, booleans hold true or false, undefined means no value was assigned yet, and null means you intentionally set an empty value.',
              imageUrl:
                'https://example.com/images/javascript-primitives-overview.png',
            },
            {
              title: 'Check your understanding',
              type: SlideType.QUESTION,
              textContent:
                'Which keyword is the safest default when you do not plan to reassign a variable?',
              questions: ['var', 'let', 'const', 'static'],
              answer: 'const',
              questionHint:
                'Choose the keyword that signals the value should stay stable.',
            },
          ],
        },
        {
          title: 'Operators, comparisons, and conditionals',
          description:
            'Learn how JavaScript compares values, evaluates expressions, and chooses between branches.',
          estimatedDuration: 26,
          slides: [
            {
              title: 'Expressions produce values',
              type: SlideType.TEXT,
              textContent:
                'Whenever you write 2 + 3, price > 100, or isLoggedIn && hasAccess, JavaScript evaluates an expression and produces a result. That result can be stored, returned, or used in a condition.',
            },
            {
              title: 'Prefer strict equality',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'Use === and !== in almost all cases. They compare both value and type, which helps you avoid surprising coercion bugs such as 0 == false returning true.',
            },
            {
              title: 'Programming is controlled decision making',
              type: SlideType.QUOTE,
              textContent:
                '"Code is a conversation with the machine, and conditionals are how we explain choices clearly."',
            },
            {
              title: 'Decision point',
              type: SlideType.QUESTION,
              textContent:
                'What does an if statement need in order to decide whether to run its block?',
              questions: [
                'A function definition',
                'A boolean-like condition',
                'A loop counter',
                'A return value from another file',
              ],
              answer: 'A boolean-like condition',
              questionHint:
                'The if statement checks whether something is truthy or falsy.',
            },
          ],
        },
      ],
    },
    {
      title: 'Functions and Data Structures',
      subtitle:
        'Move from isolated statements to reusable logic and grouped data',
      description:
        'This chapter covers how to package behavior in functions and how to model collections using arrays and objects.',
      lessons: [
        {
          title: 'Functions, parameters, and scope',
          description:
            'Understand how functions group logic, receive input, return output, and isolate variables.',
          estimatedDuration: 30,
          slides: [
            {
              title: 'A function is a reusable process',
              type: SlideType.TEXT,
              textContent:
                'Functions let you wrap a repeatable task behind a clear name. Instead of rewriting the same logic many times, you define it once and call it when needed.',
            },
            {
              title: 'Parameters turn static code into flexible code',
              type: SlideType.TEXT,
              textContent:
                'A parameter is a placeholder value that the function receives when it runs. For example, greet(name) can create a personalized message for many users without duplicating the function body.',
            },
            {
              title: 'Scope keeps variables predictable',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'Variables declared inside a function stay inside that function unless you return them. This local scope prevents naming collisions and keeps side effects easier to control.',
            },
            {
              title: 'Function behavior',
              type: SlideType.QUESTION,
              textContent:
                'What is the main benefit of returning a value from a function?',
              questions: [
                'It allows the function result to be reused elsewhere',
                'It makes the function run faster automatically',
                'It turns the function into a loop',
                'It removes the need for parameters',
              ],
              answer: 'It allows the function result to be reused elsewhere',
              questionHint:
                'Think about how another part of the app can consume the output.',
            },
          ],
        },
        {
          title: 'Arrays, objects, and real-world modeling',
          description:
            'Model lists and structured entities the same way you would in a real product.',
          estimatedDuration: 32,
          slides: [
            {
              title: 'Arrays represent ordered collections',
              type: SlideType.TEXT,
              textContent:
                'Use arrays when order matters or when you need to loop through similar items such as course lessons, product names, or API results.',
            },
            {
              title: 'Objects represent named properties',
              type: SlideType.TEXT,
              textContent:
                'Use objects when you need to describe one entity with multiple attributes, such as { title, duration, instructor, isPublished }.',
              imageUrl:
                'https://example.com/images/javascript-array-object-map.png',
            },
            {
              title: 'Choose the structure that matches the question',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'If you ask "Which item comes next?" an array usually fits. If you ask "What details does this thing have?" an object usually fits.',
            },
            {
              title: 'Structure check',
              type: SlideType.QUESTION,
              textContent:
                'Which structure is better for representing one user profile with fields such as name, email, and age?',
              questions: ['Array', 'Object', 'String', 'Boolean'],
              answer: 'Object',
              questionHint:
                'You want named properties rather than numeric indexes.',
            },
          ],
        },
      ],
    },
    {
      title: 'Browser Interactivity and Async Thinking',
      subtitle:
        'Use JavaScript where learners feel it most: the browser and API calls',
      description:
        'This chapter connects core language skills to user-facing behavior such as clicks, updates, and remote data loading.',
      lessons: [
        {
          title: 'DOM manipulation and browser events',
          description:
            'Learn how JavaScript reaches HTML elements, reacts to clicks, and updates the page.',
          estimatedDuration: 34,
          slides: [
            {
              title: 'The DOM is the page structure JavaScript can edit',
              type: SlideType.TEXT,
              textContent:
                'The Document Object Model represents the current HTML page as objects JavaScript can query and update. That is how a button click can change text, classes, visibility, or form values.',
            },
            {
              title: 'Events connect user actions to logic',
              type: SlideType.TEXT,
              textContent:
                'An event listener watches for interactions such as click, input, submit, or keydown. When the event fires, your callback runs and can update the interface.',
            },
            {
              title: 'Keep UI updates small and intentional',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'Instead of rebuilding everything, target the smallest element that needs to change. This keeps your code easier to debug and your interface easier to trust.',
            },
            {
              title: 'DOM practice',
              type: SlideType.QUESTION,
              textContent:
                'What is the main purpose of addEventListener on a button element?',
              questions: [
                'To style the button automatically',
                'To listen for user interaction and run code in response',
                'To convert HTML into JSON',
                'To save the page to a database',
              ],
              answer:
                'To listen for user interaction and run code in response',
              questionHint:
                'Think about what happens after the user clicks or types.',
            },
          ],
        },
        {
          title: 'Promises, fetch, and async or await',
          description:
            'Finish the course by learning how modern JavaScript handles time, waiting, and remote data.',
          estimatedDuration: 36,
          slides: [
            {
              title: 'Async code deals with waiting',
              type: SlideType.TEXT,
              textContent:
                'When your app loads data from an API, waits for a timer, or uploads a file, the result does not arrive instantly. JavaScript uses promises to represent work that will finish later.',
            },
            {
              title: 'async or await makes promise code easier to read',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'With async functions and await, you can write asynchronous flows in a top-to-bottom style that feels close to synchronous code while still staying non-blocking.',
            },
            {
              title: 'A healthy async habit',
              type: SlideType.QUOTE,
              textContent:
                '"Every async call should answer three questions: what starts, what succeeds, and what fails."',
            },
            {
              title: 'Network reasoning',
              type: SlideType.QUESTION,
              textContent:
                'Why should API calls usually be wrapped in try and catch when using await?',
              questions: [
                'Because await only works inside loops',
                'Because network requests can fail and need graceful error handling',
                'Because try and catch makes the response faster',
                'Because fetch returns HTML by default',
              ],
              answer:
                'Because network requests can fail and need graceful error handling',
              questionHint:
                'Think about timeouts, bad responses, and offline users.',
            },
          ],
        },
      ],
    },
  ],
  quizChapter: {
    title: 'JavaScript Essentials Final Quiz',
    subtitle: 'Validate that the learner can connect syntax to real behavior',
    description:
      'A practical checkpoint covering variables, conditionals, functions, data structures, DOM work, and async thinking.',
    quiz: {
      title: 'JavaScript Essentials Quiz',
      description:
        'A multi-topic quiz that checks whether the learner understands both syntax and practical browser behavior.',
      passingScore: 75,
      timeLimit: 18,
      questions: [
        {
          question:
            'Which keyword should usually be your default choice for a variable that will not be reassigned?',
          options: ['var', 'let', 'const', 'value'],
          correctAnswer: 2,
          explanation:
            'const signals intent clearly and helps prevent accidental reassignment.',
        },
        {
          question:
            'Which comparison operator avoids loose type coercion and is safer in most codebases?',
          options: ['==', '===', '=', '!='],
          correctAnswer: 1,
          explanation:
            'Strict equality checks both value and type, making it more predictable.',
        },
        {
          question:
            'What is the most accurate description of an object in JavaScript?',
          options: [
            'A numbered list of values',
            'A named collection of properties',
            'A special type used only for APIs',
            'A function that returns an array',
          ],
          correctAnswer: 1,
          explanation:
            'Objects are used to group named properties that describe one entity.',
        },
        {
          question:
            'Why is addEventListener useful when building interactive pages?',
          options: [
            'It lets HTML write CSS automatically',
            'It runs code in response to user or browser events',
            'It stores data permanently on the server',
            'It converts arrays into objects',
          ],
          correctAnswer: 1,
          explanation:
            'It links an event such as click or submit to a callback function.',
        },
        {
          question:
            'What problem do promises and async or await primarily solve?',
          options: [
            'They make loops shorter',
            'They model work that completes later such as network requests',
            'They replace variables',
            'They only format JSON',
          ],
          correctAnswer: 1,
          explanation:
            'They help JavaScript represent and manage asynchronous operations cleanly.',
        },
      ],
    },
  },
};

const reactCourseSeed: CourseSeedDefinition = {
  key: 'reactFundamentals',
  course: {
    name: 'React.js Fundamentals',
    description:
      'Build modern React interfaces by understanding components, state, effects, forms, routing, and repeatable UI patterns.',
    shortDescription:
      'A practical React course with stronger structure, better examples, and enough detail to test nested course responses.',
    price: 249,
    willLearn: [
      'How React thinks in components instead of page-wide scripts',
      'How JSX, props, and composition work together',
      'How state drives rerenders and why updates must stay predictable',
      'How effects should be used carefully for side effects and remote data',
      'How to structure forms, lists, and page routing in real apps',
      'How to recognize common beginner mistakes and avoid them early',
    ],
    requirements: [
      'Comfort with JavaScript fundamentals such as arrays, objects, and functions',
      'Basic HTML and CSS knowledge',
      'Node.js installed locally',
      'A willingness to test ideas in small components before scaling them up',
    ],
    targetAudience: [
      'Frontend developers learning React professionally',
      'Bootcamp or university students working on UI projects',
      'JavaScript developers moving into component-driven architecture',
      'Product-minded builders who want maintainable interfaces',
    ],
    level: CourseLevel.INTERMEDIATE,
    estimationTime: '20 hours',
    coverImage: 'https://example.com/courses/react-fundamentals-cover.jpg',
    thumbnailImage:
      'https://example.com/courses/react-fundamentals-thumb.jpg',
  },
  learningChapters: [
    {
      title: 'Thinking in React',
      subtitle:
        'Understand why React breaks interfaces into small pieces that collaborate',
      description:
        'This chapter introduces React itself, why teams use it, and how JSX and components create reusable UI.',
      lessons: [
        {
          title: 'What React solves in modern frontend development',
          description:
            'Learn the motivation behind React and why component-driven UIs became the standard.',
          estimatedDuration: 22,
          slides: [
            {
              title: 'React focuses on describing UI states',
              type: SlideType.TEXT,
              textContent:
                'Instead of manually editing the DOM after every tiny interaction, React encourages you to describe what the UI should look like for the current state and lets it handle the update.',
            },
            {
              title: 'Componentization scales teams better',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'Breaking an interface into reusable pieces makes testing, collaboration, and iteration easier because each part has a clear responsibility.',
            },
            {
              title: 'A map of the React rendering flow',
              type: SlideType.TEXT,
              textContent:
                'A component receives inputs, computes output, and React updates the screen when state changes.',
              imageUrl:
                'https://example.com/images/react-rendering-flow.png',
            },
            {
              title: 'React motivation',
              type: SlideType.QUESTION,
              textContent:
                'What is the biggest advantage of a component-based approach?',
              questions: [
                'Every file becomes shorter automatically',
                'Reusable UI pieces become easier to manage and reason about',
                'React removes the need for JavaScript',
                'Browsers stop using the DOM',
              ],
              answer:
                'Reusable UI pieces become easier to manage and reason about',
              questionHint:
                'Think about collaboration, reuse, and isolated responsibility.',
            },
          ],
        },
        {
          title: 'JSX and component composition',
          description:
            'Learn how JSX works and how parent and child components fit together.',
          estimatedDuration: 28,
          slides: [
            {
              title: 'JSX is syntax for describing UI',
              type: SlideType.TEXT,
              textContent:
                'JSX looks like HTML, but it is compiled into JavaScript function calls. This means you can mix markup and logic naturally inside a component.',
            },
            {
              title: 'Components compose like building blocks',
              type: SlideType.TEXT,
              textContent:
                'A page is usually made from smaller components such as Header, CourseCard, LessonList, and Footer. Each child handles a narrow concern while the parent assembles the experience.',
            },
            {
              title: 'Readable JSX comes from small components',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'If a component becomes too large to read comfortably, split one concept out. Small composition beats huge render functions.',
            },
            {
              title: 'JSX behavior',
              type: SlideType.QUESTION,
              textContent:
                'Which statement about JSX is correct?',
              questions: [
                'JSX can only contain static text',
                'JSX can embed JavaScript expressions inside curly braces',
                'JSX uses class instead of className',
                'JSX only works in HTML files',
              ],
              answer:
                'JSX can embed JavaScript expressions inside curly braces',
              questionHint:
                'Think about how values appear inside rendered markup.',
            },
          ],
        },
      ],
    },
    {
      title: 'State, Props, and Effects',
      subtitle:
        'Move from static components to components that change over time',
      description:
        'This chapter introduces props, local state, rendering updates, and the right mental model for side effects.',
      lessons: [
        {
          title: 'Props and state without confusion',
          description:
            'Understand the difference between external inputs and internal mutable state.',
          estimatedDuration: 32,
          slides: [
            {
              title: 'Props are inputs from the parent',
              type: SlideType.TEXT,
              textContent:
                'Props let a parent component configure a child. They are read-only inside the child, which keeps data flow predictable.',
            },
            {
              title: 'State stores values that can change over time',
              type: SlideType.TEXT,
              textContent:
                'A state variable stores information that affects rendering, such as whether a modal is open, which lesson is selected, or what text the user typed.',
            },
            {
              title: 'Do not mutate state directly',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'React relies on updates being expressed through setters such as setCount or setForm. Direct mutation often leads to stale UI and difficult bugs.',
            },
            {
              title: 'Ownership of data',
              type: SlideType.QUESTION,
              textContent:
                'When should a value usually live in state rather than a plain variable?',
              questions: [
                'When changing it should trigger a UI update',
                'When it contains a string',
                'When it comes from CSS',
                'When it should never change',
              ],
              answer: 'When changing it should trigger a UI update',
              questionHint:
                'Think about rerendering and user-visible changes.',
            },
          ],
        },
        {
          title: 'Effects, lifecycle thinking, and data fetching',
          description:
            'Use effects only for real side effects and understand common mistakes around them.',
          estimatedDuration: 34,
          slides: [
            {
              title: 'Effects synchronize React with the outside world',
              type: SlideType.TEXT,
              textContent:
                'Use an effect when your component needs to talk to something outside normal rendering such as a network request, timer, subscription, or imperative browser API.',
            },
            {
              title: 'Not every calculation belongs in an effect',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'If a value can be derived directly from props and state during render, compute it there. Effects are for synchronization, not for ordinary calculations.',
            },
            {
              title: 'Data loading flow',
              type: SlideType.TEXT,
              textContent:
                'A healthy fetch flow usually includes loading, success, and error states so the interface always communicates what is happening.',
              imageUrl: 'https://example.com/images/react-fetch-state-flow.png',
            },
            {
              title: 'Effect reasoning',
              type: SlideType.QUESTION,
              textContent:
                'Why can missing dependencies in an effect cause bugs?',
              questions: [
                'Because the component stops compiling',
                'Because the effect may read stale values and stop syncing correctly',
                'Because dependencies slow the browser too much',
                'Because effects only work once',
              ],
              answer:
                'Because the effect may read stale values and stop syncing correctly',
              questionHint:
                'Think about values changing while the effect logic stays outdated.',
            },
          ],
        },
      ],
    },
    {
      title: 'Building Real Screens',
      subtitle:
        'Apply React fundamentals to screens users actually interact with',
      description:
        'This chapter brings together form handling, list rendering, routing, and architectural habits that make apps easier to grow.',
      lessons: [
        {
          title: 'Forms, controlled inputs, and list rendering',
          description:
            'Handle user input with confidence and render dynamic data cleanly.',
          estimatedDuration: 30,
          slides: [
            {
              title: 'Controlled inputs keep the UI and data in sync',
              type: SlideType.TEXT,
              textContent:
                'In a controlled form element, the React state is the source of truth. The input shows that state, and every change updates it through an event handler.',
            },
            {
              title: 'Lists need stable keys',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'When rendering arrays, each item should get a stable key from real data such as an id. Using array indexes as keys can create subtle UI bugs when the list changes.',
            },
            {
              title: 'Good list UIs explain empty and loading states',
              type: SlideType.QUOTE,
              textContent:
                '"A polished list is not just items on success. It is also what the user sees before data arrives and when no data exists."',
            },
            {
              title: 'Rendering collections',
              type: SlideType.QUESTION,
              textContent:
                'Why does React ask for a key when mapping an array into elements?',
              questions: [
                'To style each item with CSS automatically',
                'To help React track item identity across rerenders',
                'To limit the array length',
                'To turn the list into a form',
              ],
              answer:
                'To help React track item identity across rerenders',
              questionHint:
                'Think about insertions, deletions, and reordering.',
            },
          ],
        },
        {
          title: 'Routing and maintainable component architecture',
          description:
            'Close the course by structuring screens, routes, and shared components for growth.',
          estimatedDuration: 34,
          slides: [
            {
              title: 'Routing maps URLs to UI screens',
              type: SlideType.TEXT,
              textContent:
                'Client-side routing lets the app switch between screens like /courses, /courses/:id, and /profile without forcing a full page reload.',
            },
            {
              title: 'Shared components reduce duplication',
              type: SlideType.TEXT,
              textContent:
                'When several screens repeat the same card, layout, badge, or button behavior, extract a shared component so design and behavior stay consistent.',
            },
            {
              title: 'Organize by responsibility, not by accident',
              type: SlideType.GOLDEN_INFO,
              textContent:
                'Keep presentational pieces simple, push data access into clear boundaries, and avoid giant components that fetch, transform, and render everything alone.',
            },
            {
              title: 'Architecture checkpoint',
              type: SlideType.QUESTION,
              textContent:
                'What is a strong reason to extract a reusable component?',
              questions: [
                'To create more files without changing behavior',
                'To centralize repeated UI or behavior used in multiple places',
                'To avoid using props entirely',
                'To remove state from the app',
              ],
              answer:
                'To centralize repeated UI or behavior used in multiple places',
              questionHint:
                'Think about consistency and future maintenance.',
            },
          ],
        },
      ],
    },
  ],
  quizChapter: {
    title: 'React Fundamentals Final Quiz',
    subtitle: 'Confirm the learner can reason about React, not just memorize it',
    description:
      'A capstone quiz covering components, JSX, state, effects, forms, lists, and routing decisions.',
    quiz: {
      title: 'React Fundamentals Quiz',
      description:
        'A practical quiz that measures how well the learner understands the core ideas behind React apps.',
      passingScore: 70,
      timeLimit: 20,
      questions: [
        {
          question:
            'What is the clearest description of props in React?',
          options: [
            'Internal mutable component state',
            'Read-only inputs passed from parent to child',
            'A built-in router configuration',
            'A replacement for JSX',
          ],
          correctAnswer: 1,
          explanation:
            'Props let parent components configure child components in a predictable way.',
        },
        {
          question:
            'When should a value usually be kept in component state?',
          options: [
            'When changing it should update what the user sees',
            'When the value is a number',
            'Only when using forms',
            'Never, because React handles all values itself',
          ],
          correctAnswer: 0,
          explanation:
            'State is for data that changes over time and influences rendering.',
        },
        {
          question:
            'Which statement about useEffect is most accurate?',
          options: [
            'It should be used for every computed value',
            'It is for synchronizing with external systems or side effects',
            'It replaces props',
            'It only works after a form submit',
          ],
          correctAnswer: 1,
          explanation:
            'Effects are best used when the component must synchronize with something outside render.',
        },
        {
          question:
            'Why are stable keys important when rendering lists?',
          options: [
            'They make CSS modules work',
            'They help React track item identity across updates',
            'They remove the need for ids in data',
            'They let a component rerender less than once',
          ],
          correctAnswer: 1,
          explanation:
            'Stable keys help React reconcile lists correctly when items move or change.',
        },
        {
          question:
            'What is the job of client-side routing in a React app?',
          options: [
            'To turn JSX into JavaScript',
            'To map URL changes to different UI screens without a full page refresh',
            'To store form input in local state',
            'To replace API calls',
          ],
          correctAnswer: 1,
          explanation:
            'Routing connects URLs to interface states and screens inside the application.',
        },
      ],
    },
  },
};

export async function seedCourseCatalog(
  models: CourseSeedModels,
): Promise<SeededCourseCatalog> {
  const {
    courseModel,
    chapterModel,
    lessonModel,
    quizModel,
    slideModel,
    categoryModel,
  } = models;

  console.log('Starting course catalog seed...');

  console.log('Clearing existing course data...');
  await courseModel.deleteMany({});
  await chapterModel.deleteMany({});
  await lessonModel.deleteMany({});
  await quizModel.deleteMany({});
  await slideModel.deleteMany({});
  await categoryModel.deleteMany({});

  console.log('Creating categories...');

  const programmingCategory = await categoryModel.create({
    name: 'Programming',
    description:
      'Learn programming languages and the foundational concepts required to build real applications.',
    image: 'https://example.com/categories/programming.jpg',
  });

  const webDevCategory = await categoryModel.create({
    name: 'Web Development',
    description:
      'Create modern web interfaces and applications with current frontend development practices.',
    image: 'https://example.com/categories/web-development.jpg',
  });

  console.log('Creating course 1: JavaScript Essentials...');
  const javaScriptEssentials = await createCourseFromSeed(
    models,
    programmingCategory._id,
    javaScriptCourseSeed,
  );

  console.log('Creating course 2: React.js Fundamentals...');
  const reactFundamentals = await createCourseFromSeed(
    models,
    webDevCategory._id,
    reactCourseSeed,
  );

  console.log('Course catalog seed completed successfully.');

  return {
    categories: {
      programming: programmingCategory,
      webDevelopment: webDevCategory,
    },
    courses: {
      javaScriptEssentials,
      reactFundamentals,
    },
  };
}

function getCourseSeedModels(
  app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>,
): CourseSeedModels {
  return {
    courseModel: app.get<Model<CourseDocument>>(getModelToken(Course.name)),
    chapterModel: app.get<Model<ChapterDocument>>(getModelToken(Chapter.name)),
    lessonModel: app.get<Model<LessonDocument>>(getModelToken(Lesson.name)),
    quizModel: app.get<Model<QuizDocument>>(getModelToken(Quiz.name)),
    slideModel: app.get<Model<SlideDocument>>(getModelToken(Slide.name)),
    categoryModel: app.get<Model<CategoryDocument>>(
      getModelToken(Category.name),
    ),
  };
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const models = getCourseSeedModels(app);
    await seedCourseCatalog(models);

    console.log('Summary:');
    console.log(`- Categories: ${await models.categoryModel.countDocuments()}`);
    console.log(`- Courses: ${await models.courseModel.countDocuments()}`);
    console.log(`- Chapters: ${await models.chapterModel.countDocuments()}`);
    console.log(`- Lessons: ${await models.lessonModel.countDocuments()}`);
    console.log(`- Slides: ${await models.slideModel.countDocuments()}`);
    console.log(`- Quizzes: ${await models.quizModel.countDocuments()}`);
  } catch (error) {
    console.error('Course seed failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  bootstrap();
}
