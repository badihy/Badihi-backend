import { translateErrorMessage } from './arabic-error-messages';

describe('translateErrorMessage', () => {
  it('translates exact auth messages to Arabic', () => {
    expect(
      translateErrorMessage('Please verify your email before logging in', 403),
    ).toBe('يرجى تفعيل بريدك الإلكتروني قبل تسجيل الدخول');
  });

  it('translates dynamic lesson not found messages to Arabic', () => {
    expect(
      translateErrorMessage('Lesson with id 123 was not found', 404),
    ).toBe('الدرس المطلوب غير موجود');
  });

  it('translates dynamic slide not found messages to Arabic', () => {
    expect(
      translateErrorMessage('Slide with id abc was not found', 404),
    ).toBe('السلايد المطلوب غير موجود');
  });

  it('translates upload-related bad requests to Arabic', () => {
    expect(
      translateErrorMessage('Failed to upload report image: timeout', 400),
    ).toBe('تعذر رفع صورة البلاغ');
  });
});
