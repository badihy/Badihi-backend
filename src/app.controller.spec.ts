import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    getHello: jest.fn().mockReturnValue('Hello World!'),
  };
  const authServiceMock = {
    verifyEmail: jest.fn(),
  };

  const createResponseMock = () => {
    const res = {
      send: jest.fn(),
      status: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: appServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(appServiceMock.getHello).toHaveBeenCalled();
    });
  });

  it('renders the verify-email success page after successful verification', async () => {
    const res = createResponseMock();
    authServiceMock.verifyEmail.mockResolvedValue({ message: 'ok' });

    await appController.verifyEmail('token-123', res as any);

    expect(authServiceMock.verifyEmail).toHaveBeenCalledWith('token-123');
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('تم التحقق من البريد الإلكتروني بنجاح!'),
    );
  });

  it('renders the google auth test page with the configured client id', async () => {
    const res = createResponseMock();
    const previousClientId = process.env.GOOGLE_CLIENT_ID;

    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';

    appController.getGoogleAuthTest(res as any);

    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('test-google-client-id'),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('Google Auth End-to-End Test'),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/mobile/auth-code'),
    );

    process.env.GOOGLE_CLIENT_ID = previousClientId;
  });

  it('returns the reset-password page wired to the prefixed API route', async () => {
    const res = createResponseMock();

    await appController.showResetPasswordForm('token-123', res as any);

    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/reset-password"),
    );
  });

  it('returns 400 when reset-password is opened without a token', async () => {
    const res = createResponseMock();

    await appController.showResetPasswordForm('', res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('الرابط غير صالح'),
    );
  });
});
