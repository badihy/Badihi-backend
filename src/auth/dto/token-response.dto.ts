import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({
    example: {
      id: '641b3f6f9f1b8c0012345678',
      email: 'user@example.com',
      username: 'user_123',
      phone: '+1234567890',
      name: 'John Doe',
      profileImage: 'https://example.com/avatar.jpg',
    },
  })
  user: {
    id: string;
    email?: string;
    username?: string;
    phone?: string;
    name: string;
    profileImage?: string;
  };
}
