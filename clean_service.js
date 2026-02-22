const fs = require('fs');
const path = 'e:\\Projects\\Badihi-backend\\src\\courses\\courses.service.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the line index of // CHAPTER CRUDs
const chapterCrudsIndex = lines.findIndex(line => line.includes('CHAPTER CRUDs'));

if (chapterCrudsIndex > -1) {
  // truncate
  lines = lines.slice(0, chapterCrudsIndex - 1);
  // add a closing brace
  lines.push('}');
  
  // Also clean up imports
  // Remove unused DTOs and UserService
  lines = lines.filter(line => {
    if (line.includes('CreateChapterDto')) return false;
    if (line.includes('CreateLessonDto')) return false;
    if (line.includes('CreateQuizDto')) return false;
    if (line.includes('import { Enrollment, EnrollmentDocument }')) return false;
    if (line.includes('import { UserService }')) return false;
    return true;
  });

  // Remove unused injected models from constructor
  // finding constructor
  for(let i=0; i<lines.length; i++) {
    if(lines[i].includes('private chapterModel: Model<ChapterDocument>')) {
      lines[i] = '';
    }
    if(lines[i].includes('private lessonModel: Model<LessonDocument>')) {
      lines[i] = '';
    }
    if(lines[i].includes('private quizModel: Model<QuizDocument>')) {
      lines[i] = '';
    }
    if(lines[i].includes('private enrollmentModel: Model<EnrollmentDocument>')) {
      lines[i] = '';
    }
    if(lines[i].includes('private readonly userService: UserService')) {
      lines[i] = '';
    }
  }

  // Remove empty lines from constructor optionally
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Successfully cleaned courses.service.ts');
} else {
  console.log('Could not find CHAPTER CRUDs marker');
}
