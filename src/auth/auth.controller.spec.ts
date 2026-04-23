import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    googleSignInMobile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates mobile Google sign-in to AuthService', async () => {
    const expected = {
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        name: 'User Name',
      },
    };

    authServiceMock.googleSignInMobile.mockResolvedValue(expected);

    await expect(
      controller.googleSignInMobile({ idToken: 'google-id-token' }),
    ).resolves.toEqual(expected);
    expect(authServiceMock.googleSignInMobile).toHaveBeenCalledWith(
      'google-id-token',
    );
  });

});
