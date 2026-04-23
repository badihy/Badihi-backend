import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../common/services/email.service';

describe('AuthService', () => {
  let service: AuthService;

  const userServiceMock = {
    findOneByEmail: jest.fn(),
    findById: jest.fn(),
    updateRefreshToken: jest.fn(),
    findByResetToken: jest.fn(),
    updatePassword: jest.fn(),
    verifyEmail: jest.fn(),
    findOrCreateGoogleUser: jest.fn(),
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
  };
  const configServiceMock = {
    get: jest.fn((key: string) => key),
  };
  const emailServiceMock = {
    sendResetPasswordEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('blocks login for accounts that have not verified their email', async () => {
    const password = await bcrypt.hash('secret123', 10);

    userServiceMock.findOneByEmail.mockResolvedValue({
      _id: 'user-1',
      email: 'user@example.com',
      password,
      isVerified: false,
    });

    await expect(
      service.login({ email: 'user@example.com', password: 'secret123' }),
    ).rejects.toThrow(ForbiddenException);
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });

  it('marks the email as verified without issuing login tokens', async () => {
    const verifiedUser = {
      _id: 'user-1',
      email: 'user@example.com',
      username: 'user123',
      phone: '201234567890',
      fullName: 'Badihi User',
      profileImage: 'https://example.com/avatar.png',
      isVerified: true,
    };

    userServiceMock.verifyEmail.mockResolvedValue(verifiedUser);

    const result = await service.verifyEmail('verify-token');

    expect(userServiceMock.verifyEmail).toHaveBeenCalledWith('verify-token');
    expect(result).toEqual({
      message: 'Email verified successfully',
    });
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });
});
