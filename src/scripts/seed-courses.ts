import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
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

  const courseModel  = app.get<Model<CourseDocument>>(getModelToken('Course'));
  const chapterModel = app.get<Model<ChapterDocument>>(getModelToken('Chapter'));
  const lessonModel  = app.get<Model<LessonDocument>>(getModelToken('Lesson'));
  const quizModel    = app.get<Model<QuizDocument>>(getModelToken('Quiz'));
  const slideModel   = app.get<Model<SlideDocument>>(getModelToken('Slide'));
  const categoryModel = app.get<Model<CategoryDocument>>(getModelToken('Category'));

  console.log('🌱 بدء زرع بيانات الدورات التدريبية...');

  try {
    // ─── مسح البيانات القديمة ───────────────────────────────────────────────
    console.log('🗑️  مسح البيانات الموجودة...');
    await courseModel.deleteMany({});
    await chapterModel.deleteMany({});
    await lessonModel.deleteMany({});
    await quizModel.deleteMany({});
    await slideModel.deleteMany({});

    // ─── الفئات ─────────────────────────────────────────────────────────────
    console.log('📁 إنشاء الفئات...');

    let branchingCategory = await categoryModel.findOne({ name: 'البرمجة' });
    if (!branchingCategory) {
      branchingCategory = await categoryModel.create({
        name: 'البرمجة',
        description: 'تعلّم لغات البرمجة والمفاهيم الأساسية لبناء التطبيقات',
        image: 'https://example.com/categories/programming.jpg',
      });
    }

    let webDevCategory = await categoryModel.findOne({ name: 'تطوير الويب' });
    if (!webDevCategory) {
      webDevCategory = await categoryModel.create({
        name: 'تطوير الويب',
        description: 'بناء تطبيقات ويب حديثة وتفاعلية باستخدام أحدث التقنيات',
        image: 'https://example.com/categories/webdev.jpg',
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // الدورة الأولى: أساسيات جافاسكريبت
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📚 إنشاء الدورة الأولى: أساسيات جافاسكريبت...');

    const jsCourse = await courseModel.create({
      name: 'أساسيات جافاسكريبت',
      description:
        'تعلّم أساسيات لغة البرمجة جافاسكريبت من الصفر حتى الاحتراف، مع تطبيقات عملية تُمكّنك من بناء صفحات ويب تفاعلية.',
      shortDescription:
        'أتقن جافاسكريبت من الصفر وابنِ أول تطبيقاتك التفاعلية على الويب',
      price: 149,
      category: branchingCategory._id,
      willLearn: [
        'المتغيرات وأنواع البيانات',
        'الدوال والنطاق (Scope)',
        'المصفوفات والكائنات',
        'هياكل التحكم (if / for / while)',
        'التعامل مع DOM وإضافة التفاعلية',
        'مفاهيم البرمجة غير المتزامنة (Async/Await)',
      ],
      requirements: [
        'مهارات أساسية في استخدام الحاسوب',
        'محرر نصوص (يُنصح بـ VS Code)',
        'متصفح ويب حديث',
      ],
      targetAudience: [
        'المبتدئون في البرمجة',
        'الطلاب الجامعيون',
        'المطورون الراغبون في تعلّم الواجهة الأمامية',
        'المحترفون الراغبون في التحوّل المهني',
      ],
      level: CourseLevel.BEGINNER,
      estimationTime: '10 ساعات',
      coverImage: 'https://example.com/courses/js-cover.jpg',
      thumbnailImage: 'https://example.com/courses/js-thumb.jpg',
    });

    // ── الفصل الأول: مقدمة في جافاسكريبت ──────────────────────────────────
    console.log('  📖 إنشاء الفصل الأول: مقدمة في جافاسكريبت...');
    const jsChapter1 = await chapterModel.create({
      title: 'مقدمة في جافاسكريبت',
      subtitle: 'ابدأ رحلتك مع أشهر لغة برمجة على الويب',
      description: 'تعرّف على جافاسكريبت، تاريخها، وكيفية كتابة أول سطر كود',
      orderIndex: 1,
      course: jsCourse._id,
    });

    // ── الدرس الأول: المتغيرات وأنواع البيانات ─────────────────────────────
    console.log('    📝 إنشاء الدرس الأول: المتغيرات وأنواع البيانات...');
    const jsLesson1 = await lessonModel.create({
      title: 'المتغيرات وأنواع البيانات',
      description: 'تعلّم كيفية تعريف المتغيرات واستخدام أنواع البيانات المختلفة في جافاسكريبت',
      orderIndex: 1,
      chapter: jsChapter1._id,
      estimatedDuration: 20,
    });

    // الشرائح
    const jsSlide1 = await slideModel.create({
      title: 'ما هو المتغير؟',
      type: SlideType.TEXT,
      textContent:
        'المتغير هو حاوية لتخزين قيمة بيانات. في جافاسكريبت يمكنك تعريف المتغيرات باستخدام الكلمات المفتاحية: var أو let أو const.',
      orderIndex: 1,
      lesson: jsLesson1._id,
    });

    const jsSlide2 = await slideModel.create({
      title: 'أنواع البيانات السبعة',
      type: SlideType.GOLDEN_INFO,
      textContent:
        'تحتوي جافاسكريبت على سبعة أنواع بيانات أساسية هي: String (نص) – Number (رقم) – Boolean (صح/خطأ) – Undefined – Null – Symbol – BigInt.',
      orderIndex: 2,
      lesson: jsLesson1._id,
    });

    const jsSlide3 = await slideModel.create({
      title: 'اقتباس ملهم',
      type: SlideType.QUOTE,
      textContent:
        '"أي شخص يمكنه تعلّم البرمجة. البرمجة تُعلّمك كيف تُفكّر." – ستيف جوبز',
      orderIndex: 3,
      lesson: jsLesson1._id,
    });

    const jsSlide4 = await slideModel.create({
      title: 'سؤال تدريبي',
      type: SlideType.QUESTION,
      textContent: 'أي كلمة مفتاحية تُستخدم لتعريف ثابت لا يمكن تغيير قيمته؟',
      questions: ['var', 'let', 'const', 'static'],
      answer: 'const',
      questionHint: 'فكّر في المتغير الذي لا يمكن إعادة تعيينه بعد التعريف',
      orderIndex: 4,
      lesson: jsLesson1._id,
    });

    jsLesson1.slides = [jsSlide1._id, jsSlide2._id, jsSlide3._id, jsSlide4._id] as any;
    await jsLesson1.save();

    // ── الدرس الثاني: الدوال ───────────────────────────────────────────────
    console.log('    📝 إنشاء الدرس الثاني: الدوال...');
    const jsLesson2 = await lessonModel.create({
      title: 'الدوال في جافاسكريبت',
      description: 'تعلّم كيفية إنشاء الدوال واستدعائها وفهم مفهوم النطاق (Scope)',
      orderIndex: 2,
      chapter: jsChapter1._id,
      estimatedDuration: 25,
    });

    const jsSlide5 = await slideModel.create({
      title: 'تعريف الدالة',
      type: SlideType.TEXT,
      textContent:
        'الدالة هي كتلة كود قابلة لإعادة الاستخدام. يمكن تعريفها بطريقتين:\n' +
        '1. function greet(name) { return `مرحباً، ${name}!`; }\n' +
        '2. const greet = (name) => `مرحباً، ${name}!`;',
      orderIndex: 1,
      lesson: jsLesson2._id,
    });

    const jsSlide6 = await slideModel.create({
      title: 'نصيحة ذهبية عن الدوال',
      type: SlideType.GOLDEN_INFO,
      textContent:
        'اكتب دوالاً صغيرة ومُختصة: كل دالة يجب أن تؤدي مهمة واحدة فقط (Single Responsibility Principle).',
      orderIndex: 2,
      lesson: jsLesson2._id,
    });

    const jsSlide7 = await slideModel.create({
      title: 'سؤال تدريبي: الدوال',
      type: SlideType.QUESTION,
      textContent: 'ما الفرق الرئيسي بين function declaration وfunction expression؟',
      questions: [
        'لا يوجد فرق',
        'الـ declaration تُرفع (Hoisted) بينما الـ expression لا',
        'الـ expression أسرع في الأداء',
        'الـ declaration لا يمكنها قبول معاملات',
      ],
      answer: 'الـ declaration تُرفع (Hoisted) بينما الـ expression لا',
      questionHint: 'فكّر في مفهوم الرفع (Hoisting) في جافاسكريبت',
      orderIndex: 3,
      lesson: jsLesson2._id,
    });

    jsLesson2.slides = [jsSlide5._id, jsSlide6._id, jsSlide7._id] as any;
    await jsLesson2.save();

    jsChapter1.lessons = [jsLesson1._id, jsLesson2._id] as any;
    await jsChapter1.save();

    // ── الفصل الثاني: اختبار تقييمي ────────────────────────────────────────
    console.log('  📖 إنشاء الفصل الثاني: الاختبار التقييمي...');
    const jsChapter2 = await chapterModel.create({
      title: 'تقييم الفصل الأول',
      subtitle: 'اختبر مدى فهمك لأساسيات جافاسكريبت',
      description: 'اختبار شامل يغطي المتغيرات وأنواع البيانات والدوال',
      orderIndex: 2,
      course: jsCourse._id,
    });

    const jsQuiz = await quizModel.create({
      title: 'اختبار أساسيات جافاسكريبت',
      description: 'اختبر فهمك للمتغيرات وأنواع البيانات والدوال في جافاسكريبت',
      chapter: jsChapter2._id,
      questions: [
        {
          question: 'أي من التالي ليس نوع بيانات في جافاسكريبت؟',
          options: ['String', 'Number', 'Character', 'Boolean'],
          correctAnswer: 2,
          explanation:
            'جافاسكريبت لا تحتوي على نوع "Character". النصوص الفردية تُعالج كـ String.',
          orderIndex: 1,
        },
        {
          question: 'ما الناتج من تنفيذ: typeof null في جافاسكريبت؟',
          options: ['"null"', '"undefined"', '"object"', '"boolean"'],
          correctAnswer: 2,
          explanation:
            'هذه ثغرة تاريخية في جافاسكريبت؛ typeof null يُعيد "object" رغم أن null ليس كائناً.',
          orderIndex: 2,
        },
        {
          question: 'أي كلمة مفتاحية تُنشئ متغيراً محدوداً بنطاق الكتلة (Block Scope)؟',
          options: ['var', 'let', 'function', 'global'],
          correctAnswer: 1,
          explanation:
            'let وconst لهما نطاق الكتلة، بينما var لها نطاق الدالة أو العام.',
          orderIndex: 3,
        },
        {
          question: 'ما صيغة الدالة السهمية (Arrow Function) الصحيحة؟',
          options: [
            'function(x) => x * 2',
            'const double = (x) => x * 2;',
            'arrow double(x) { return x * 2; }',
            '(x) -> x * 2',
          ],
          correctAnswer: 1,
          explanation: 'الدالة السهمية تُكتب بصيغة: const fn = (params) => expression;',
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

    // ═══════════════════════════════════════════════════════════════════════════
    // الدورة الثانية: أساسيات React.js
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📚 إنشاء الدورة الثانية: أساسيات React.js...');

    const reactCourse = await courseModel.create({
      name: 'أساسيات React.js',
      description:
        'أتقن مكتبة React.js لبناء واجهات مستخدم ديناميكية وتفاعلية. ستتعلم في هذه الدورة المكوّنات والـ Hooks وإدارة الحالة وأفضل الممارسات.',
      shortDescription:
        'ابنِ تطبيقات ويب تفاعلية وديناميكية باستخدام مكتبة React.js الأكثر شيوعاً',
      price: 249,
      category: webDevCategory._id,
      willLearn: [
        'مفهوم المكوّنات (Components)',
        'صيغة JSX وكيفية استخدامها',
        'إدارة الحالة (State) باستخدام useState',
        'التعامل مع الأحداث والـ Props',
        'الـ Hooks الأساسية: useEffect وuseContext',
        'التوجيه باستخدام React Router',
      ],
      requirements: [
        'إتقان أساسيات جافاسكريبت (ES6+)',
        'معرفة بـ HTML وCSS',
        'تثبيت Node.js على الجهاز',
      ],
      targetAudience: [
        'مطوّرو الواجهة الأمامية',
        'مطوّرو الويب المتكاملون',
        'مطوّرو جافاسكريبت الراغبون في تعلّم React',
        'مصمّمو UI/UX الراغبون في تعلّم التطوير',
      ],
      level: CourseLevel.INTERMEDIATE,
      estimationTime: '15 ساعة',
      coverImage: 'https://example.com/courses/react-cover.jpg',
      thumbnailImage: 'https://example.com/courses/react-thumb.jpg',
    });

    // ── الفصل الأول: البداية مع React ──────────────────────────────────────
    console.log('  📖 إنشاء الفصل الأول: البداية مع React...');
    const reactChapter1 = await chapterModel.create({
      title: 'البداية مع React',
      subtitle: 'افهم فلسفة React وكيف تختلف عن الـ Vanilla JS',
      description: 'مقدمة إلى React، إعداد بيئة العمل، وإنشاء أول مشروع',
      orderIndex: 1,
      course: reactCourse._id,
    });

    // ── الدرس الأول: ما هو React؟ ─────────────────────────────────────────
    console.log('    📝 إنشاء الدرس الأول: ما هو React؟...');
    const reactLesson1 = await lessonModel.create({
      title: 'ما هو React وما الذي يميّزه؟',
      description: 'تعرّف على React وسبب شيوعه الواسع في مجتمع تطوير الويب',
      orderIndex: 1,
      chapter: reactChapter1._id,
      estimatedDuration: 15,
    });

    const reactSlide1 = await slideModel.create({
      title: 'نظرة عامة على React',
      type: SlideType.TEXT,
      textContent:
        'React هي مكتبة جافاسكريبت مفتوحة المصدر طوّرتها شركة Meta (فيسبوك سابقاً) لبناء واجهات المستخدم، ولا سيما تطبيقات الصفحة الواحدة (SPA).',
      orderIndex: 1,
      lesson: reactLesson1._id,
    });

    const reactSlide2 = await slideModel.create({
      title: 'لماذا React؟',
      type: SlideType.GOLDEN_INFO,
      textContent:
        'React تعتمد على بنية المكوّنات (Component-Based) والـ Virtual DOM، مما يجعل تحديثات واجهة المستخدم فعّالة جداً وسهلة الصيانة.',
      orderIndex: 2,
      lesson: reactLesson1._id,
    });

    const reactSlide3 = await slideModel.create({
      title: 'اقتباس من مجتمع React',
      type: SlideType.QUOTE,
      textContent:
        '"تعلّم React مرة واحدة، ثم اكتب التطبيقات في أي مكان." – فريق React',
      orderIndex: 3,
      lesson: reactLesson1._id,
    });

    const reactSlide4 = await slideModel.create({
      title: 'سؤال: ما الـ Virtual DOM؟',
      type: SlideType.QUESTION,
      textContent:
        'أي من التعريفات التالية يصف الـ Virtual DOM بشكل صحيح؟',
      questions: [
        'هو DOM حقيقي يُنشئه المتصفح',
        'هو نسخة افتراضية من شجرة DOM تُدار بواسطة React في الذاكرة',
        'هو إطار عمل منفصل عن React',
        'هو قاعدة بيانات لحفظ حالة التطبيق',
      ],
      answer: 'هو نسخة افتراضية من شجرة DOM تُدار بواسطة React في الذاكرة',
      questionHint: 'فكّر في كيفية تحسين React لأداء التحديثات',
      orderIndex: 4,
      lesson: reactLesson1._id,
    });

    reactLesson1.slides = [reactSlide1._id, reactSlide2._id, reactSlide3._id, reactSlide4._id] as any;
    await reactLesson1.save();

    // ── الدرس الثاني: المكوّنات والـ JSX ──────────────────────────────────
    console.log('    📝 إنشاء الدرس الثاني: المكوّنات والـ JSX...');
    const reactLesson2 = await lessonModel.create({
      title: 'المكوّنات وصيغة JSX',
      description: 'تعلّم كيفية إنشاء المكوّنات وكتابة JSX بشكل صحيح',
      orderIndex: 2,
      chapter: reactChapter1._id,
      estimatedDuration: 30,
    });

    const reactSlide5 = await slideModel.create({
      title: 'المكوّنة الأولى',
      type: SlideType.TEXT,
      textContent:
        'المكوّن في React عبارة عن دالة تُعيد JSX:\n' +
        'function WelcomeCard() {\n' +
        '  return <div className="card">مرحباً بك في React!</div>;\n' +
        '}',
      orderIndex: 1,
      lesson: reactLesson2._id,
    });

    const reactSlide6 = await slideModel.create({
      title: 'مثال مصوّر: مكوّن بطاقة',
      type: SlideType.TEXT,
      textContent: 'انظر إلى مثال مكوّن بطاقة مستخدم يستقبل اسم المستخدم وصورته عبر الـ Props.',
      imageUrl: 'https://example.com/images/react-component-diagram.png',
      orderIndex: 2,
      lesson: reactLesson2._id,
    });

    const reactSlide7 = await slideModel.create({
      title: 'سؤال: JSX',
      type: SlideType.QUESTION,
      textContent: 'ما الذي يُميّز JSX عن HTML العادي؟',
      questions: [
        'JSX يستخدم class بدلاً من className',
        'JSX يسمح بتضمين تعبيرات جافاسكريبت داخل {}',
        'JSX لا يدعم الـ CSS',
        'لا يوجد فرق بينهما',
      ],
      answer: 'JSX يسمح بتضمين تعبيرات جافاسكريبت داخل {}',
      questionHint: 'فكّر في الأقواس المنحنية {} ودورها في JSX',
      orderIndex: 3,
      lesson: reactLesson2._id,
    });

    reactLesson2.slides = [reactSlide5._id, reactSlide6._id, reactSlide7._id] as any;
    await reactLesson2.save();

    reactChapter1.lessons = [reactLesson1._id, reactLesson2._id] as any;
    await reactChapter1.save();

    // ── الفصل الثاني: اختبار React ─────────────────────────────────────────
    console.log('  📖 إنشاء الفصل الثاني: اختبار أساسيات React...');
    const reactChapter2 = await chapterModel.create({
      title: 'اختبار أساسيات React',
      subtitle: 'تحقّق من فهمك قبل الانتقال للمحتوى المتقدم',
      description: 'اختبار يشمل المكوّنات وJSX والـ Virtual DOM',
      orderIndex: 2,
      course: reactCourse._id,
    });

    const reactQuiz = await quizModel.create({
      title: 'اختبار أساسيات React.js',
      description: 'اختبر معرفتك بمفاهيم React الأساسية: المكوّنات وJSX والـ Virtual DOM',
      chapter: reactChapter2._id,
      questions: [
        {
          question: 'ما هو الـ Virtual DOM؟',
          options: [
            'نسخة مُبسَّطة من DOM المتصفح تُخزَّن في الذاكرة لتحسين الأداء',
            'واجهة برمجية لإنشاء قواعد بيانات',
            'أداة لإدارة الـ CSS في React',
            'مكوّن خاص مدمج في React',
          ],
          correctAnswer: 0,
          explanation:
            'الـ Virtual DOM هو تمثيل خفيف الوزن لشجرة DOM الفعلية. React يقارن بين نسختين منه ليُحدّث فقط ما تغيّر.',
          orderIndex: 1,
        },
        {
          question: 'ما الخاصية الصحيحة لتعيين الكلاس CSS في JSX؟',
          options: ['class', 'className', 'cssClass', 'styleClass'],
          correctAnswer: 1,
          explanation:
            'في JSX نستخدم className بدلاً من class لتجنب التعارض مع الكلمة المحجوزة class في جافاسكريبت.',
          orderIndex: 2,
        },
        {
          question: 'أي Hook يُستخدم لإدارة حالة المكوّن في React؟',
          options: ['useEffect', 'useState', 'useContext', 'useReducer'],
          correctAnswer: 1,
          explanation:
            'useState هو الـ Hook الأساسي لإضافة الحالة (State) للمكوّنات الوظيفية.',
          orderIndex: 3,
        },
        {
          question: 'ما الـ Prop في React؟',
          options: [
            'متغير داخلي خاص بالمكوّن لا يمكن تمريره للخارج',
            'بيانات تُمرَّر من المكوّن الأب إلى المكوّن الابن',
            'طريقة لاستدعاء قاعدة البيانات',
            'خطاف (Hook) مدمج في React',
          ],
          correctAnswer: 1,
          explanation:
            'الـ Props (اختصار Properties) هي البيانات التي يُرسلها المكوّن الأب إلى المكوّنات الأبناء وهي للقراءة فقط.',
          orderIndex: 4,
        },
        {
          question: 'ما هو الناتج الصحيح لمكوّن React؟',
          options: [
            'سلسلة JSON',
            'عنصر JSX أو null',
            'كائن JavaScript عادي',
            'ملف HTML منفصل',
          ],
          correctAnswer: 1,
          explanation:
            'المكوّن الوظيفي في React يجب أن يُعيد عنصر JSX أو null. لا يمكنه إعادة أنواع بيانات اعتباطية.',
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

    // ─── ملخص ───────────────────────────────────────────────────────────────
    console.log('\n✅ اكتملت عملية زرع البيانات بنجاح!\n');
    console.log('📊 الإحصائيات:');
    console.log(`   - الدورات    : ${await courseModel.countDocuments()}`);
    console.log(`   - الفصول     : ${await chapterModel.countDocuments()}`);
    console.log(`   - الدروس     : ${await lessonModel.countDocuments()}`);
    console.log(`   - الشرائح    : ${await slideModel.countDocuments()}`);
    console.log(`   - الاختبارات : ${await quizModel.countDocuments()}`);

  } catch (error) {
    console.error('❌ خطأ أثناء زرع البيانات:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
