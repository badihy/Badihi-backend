import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/public.constant';

/** Skips the global JWT guard for public routes such as auth and deep-link endpoints. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
