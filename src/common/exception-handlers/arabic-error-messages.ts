import { ValidationError } from 'class-validator';

const ARABIC_TEXT = /[\u0600-\u06ff]/;

const FIELD_LABELS: Record<string, string> = {
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  passwordConfirm: 'تأكيد كلمة المرور',
  newPassword: 'كلمة المرور الجديدة',
  confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
  token: 'رمز التحقق',
  idToken: 'رمز تسجيل الدخول بجوجل',
  username: 'اسم المستخدم',
  fullName: 'الاسم',
  name: 'الاسم',
  phone: 'رقم الهاتف',
  profileImage: 'الصورة الشخصية',
  title: 'العنوان',
  description: 'الوصف',
  course: 'الدورة',
  chapter: 'الفصل',
  lesson: 'الدرس',
  rating: 'التقييم',
  subject: 'الموضوع',
  message: 'الرسالة',
  imageUrl: 'الصورة',
};

const EXACT_MESSAGES: Record<string, string> = {
  Unauthorized: 'يجب تسجيل الدخول أولاً',
  'Forbidden resource': 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
  'Access denied': 'تم رفض الوصول',
  'User not found': 'المستخدم غير موجود',
  'Invalid credentials': 'بيانات تسجيل الدخول غير صحيحة',
  'Passwords do not match': 'كلمتا المرور غير متطابقتين',
  'Invalid or expired token': 'الرابط غير صالح أو انتهت صلاحيته',
  'Invalid or expired verification token':
    'رابط تفعيل البريد غير صالح أو انتهت صلاحيته',
  'Invalid or expired ID token': 'رمز تسجيل الدخول غير صالح أو انتهت صلاحيته',
  'Google account email is required': 'بريد حساب جوجل مطلوب',
  'Unable to create or retrieve the user':
    'تعذر إنشاء المستخدم أو الوصول إلى بياناته',
  'idToken is required': 'رمز تسجيل الدخول بجوجل مطلوب',
  'Profile image is required': 'الصورة الشخصية مطلوبة',
  'Username is already in use': 'اسم المستخدم مستخدم بالفعل',
  'You cannot access another user\'s data':
    'لا يمكنك الوصول إلى بيانات مستخدم آخر',
  'You do not have permission to access this resource':
    'ليس لديك صلاحية للوصول إلى هذا المورد',
  'No files were provided': 'لم يتم إرسال أي ملفات',
  'File URL is required': 'رابط الملف مطلوب',
  'Failed to delete file': 'تعذر حذف الملف',
  'Report not found': 'البلاغ غير موجود',
  'Certificate not found': 'الشهادة غير موجودة',
  'Invalid certificate number': 'رقم الشهادة غير صالح',
  'Course not found': 'الدورة غير موجودة',
  'User is not enrolled in this course': 'المستخدم غير مسجل في هذه الدورة',
  'Invalid JSON body': 'صيغة JSON غير صحيحة',
  'Internal server error': 'حدث خطأ داخلي في الخادم',
};

function labelFor(field: string): string {
  return FIELD_LABELS[field] || field;
}

function hasArabic(message: string): boolean {
  return ARABIC_TEXT.test(message);
}

function translateKnownPattern(message: string): string | undefined {
  if (/^Duplicate value for field/i.test(message)) {
    return 'هذه القيمة مستخدمة بالفعل';
  }

  if (/duplicate key/i.test(message)) {
    return 'هذه البيانات مستخدمة بالفعل';
  }

  if (/Cast to ObjectId failed/i.test(message)) {
    return 'المعرّف المرسل غير صالح';
  }

  if (/validation failed/i.test(message)) {
    return 'البيانات المرسلة غير صحيحة';
  }

  if (/jwt expired/i.test(message)) {
    return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
  }

  if (/invalid token|jwt malformed|invalid signature/i.test(message)) {
    return 'رمز الدخول غير صالح';
  }

  if (/network connection failed/i.test(message)) {
    return 'تعذر الاتصال بالخدمة، يرجى المحاولة لاحقاً';
  }

  if (/timeout/i.test(message)) {
    return 'انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى';
  }

  if (/not found/i.test(message)) {
    return 'المورد المطلوب غير موجود';
  }

  if (/is required/i.test(message)) {
    return 'بعض البيانات المطلوبة غير مكتملة';
  }

  return undefined;
}

export function translateErrorMessage(
  message: unknown,
  statusCode = 500,
): string | string[] {
  if (Array.isArray(message)) {
    return message.map((item) => String(translateErrorMessage(item, statusCode)));
  }

  const text = String(message || '').trim();
  if (!text) {
    return statusCode >= 500
      ? 'حدث خطأ داخلي في الخادم'
      : 'حدث خطأ أثناء معالجة الطلب';
  }

  if (hasArabic(text)) return text;
  if (EXACT_MESSAGES[text]) return EXACT_MESSAGES[text];

  const patternMessage = translateKnownPattern(text);
  if (patternMessage) return patternMessage;

  if (statusCode >= 500) {
    return 'حدث خطأ داخلي في الخادم';
  }

  if (statusCode === 401) {
    return 'يجب تسجيل الدخول أولاً';
  }

  if (statusCode === 403) {
    return 'ليس لديك صلاحية لتنفيذ هذا الإجراء';
  }

  if (statusCode === 404) {
    return 'المورد المطلوب غير موجود';
  }

  return 'الطلب غير صحيح، يرجى مراجعة البيانات المرسلة';
}

function translateConstraint(error: ValidationError, constraintName: string) {
  const field = labelFor(error.property);

  switch (constraintName) {
    case 'isNotEmpty':
      return `${field} مطلوب`;
    case 'isEmail':
      return `${field} يجب أن يكون بريداً إلكترونياً صحيحاً`;
    case 'isString':
      return `${field} يجب أن يكون نصاً`;
    case 'isNumber':
      return `${field} يجب أن يكون رقماً`;
    case 'isBoolean':
      return `${field} يجب أن يكون صحيحاً أو خطأ`;
    case 'isArray':
      return `${field} يجب أن يكون قائمة`;
    case 'isEnum':
      return `${field} يحتوي على قيمة غير صحيحة`;
    case 'isMongoId':
      return `${field} غير صالح`;
    case 'minLength': {
      const min = error.constraints?.minLength?.match(/\d+/)?.[0];
      return min
        ? `${field} يجب ألا يقل عن ${min} أحرف`
        : `${field} قصير جداً`;
    }
    case 'maxLength': {
      const max = error.constraints?.maxLength?.match(/\d+/)?.[0];
      return max
        ? `${field} يجب ألا يزيد عن ${max} حرفاً`
        : `${field} طويل جداً`;
    }
    case 'min':
      return `${field} أقل من القيمة المسموح بها`;
    case 'max':
      return `${field} أكبر من القيمة المسموح بها`;
    case 'Match':
      return `${field} غير مطابق`;
    default:
      return `${field} غير صحيح`;
  }
}

function collectValidationMessages(
  errors: ValidationError[],
  messages: string[],
) {
  for (const error of errors) {
    if (error.constraints) {
      for (const constraintName of Object.keys(error.constraints)) {
        messages.push(translateConstraint(error, constraintName));
      }
    }

    if (error.children?.length) {
      collectValidationMessages(error.children, messages);
    }
  }
}

export function translateValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  collectValidationMessages(errors, messages);
  return [...new Set(messages)];
}
