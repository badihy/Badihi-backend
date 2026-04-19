import { ApiPropertyOptional } from '@nestjs/swagger';

/** بديل عن ترويسة Authorization عند إرسال JSON (شائع في الموبايل). */
export class GoogleIdTokenBodyDto {
  @ApiPropertyOptional({
    description:
      'Google أو Firebase **ID token** (JWT)، وليس access token. يمكن أيضاً إرساله عبر Authorization: Bearer …',
    example: 'eyJhbGciOiJSUzI1NiIs...',
  })
  idToken?: string;
}
