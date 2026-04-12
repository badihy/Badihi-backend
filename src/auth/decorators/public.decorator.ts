import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/public.constant';

/** يتخطى حارس JWT العالمي (مسارات تسجيل الدخول، التسجيل، الروابط العميقة، إلخ). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
