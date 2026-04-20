import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';

describe('CertificateController', () => {
  let controller: CertificateController;
  const certificateServiceMock = {
    issue: jest.fn(),
    findByUser: jest.fn(),
    verifyByNumber: jest.fn(),
    findOneForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificateController],
      providers: [
        { provide: CertificateService, useValue: certificateServiceMock },
      ],
    }).compile();

    controller = module.get<CertificateController>(CertificateController);
    jest.clearAllMocks();
  });

  it('issues certificates for the authenticated user only', async () => {
    await controller.issue({ courseId: 'course-1' }, 'user-1');

    expect(certificateServiceMock.issue).toHaveBeenCalledWith(
      'user-1',
      'course-1',
    );
  });

  it('blocks reading another user certificates', async () => {
    expect(() => controller.findByUser('user-2', 'user-1')).toThrow(
      ForbiddenException,
    );
    expect(certificateServiceMock.findByUser).not.toHaveBeenCalled();
  });

  it('loads a certificate within the authenticated user scope', async () => {
    await controller.findOne('cert-1', 'user-1');

    expect(certificateServiceMock.findOneForUser).toHaveBeenCalledWith(
      'cert-1',
      'user-1',
    );
  });
});
