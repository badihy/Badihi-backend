import { ApiPropertyOptional } from '@nestjs/swagger';

/** Progress request bodies are empty because the user is derived from the access token. */
export class MarkEnrollmentUserDto {
  @ApiPropertyOptional({
    type: String,
    deprecated: true,
    description:
      'This field is no longer used. The user is determined from the access token.',
  })
  readonly userId?: string;
}
