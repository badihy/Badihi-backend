import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Certificate')
@ApiBearerAuth('JWT-access')
@Controller('certificate')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post('issue')
  @ApiOperation({ summary: 'Issue certificate after course completion' })
  issue(
    @Body() issueCertificateDto: IssueCertificateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.certificateService.issue(userId, issueCertificateDto.courseId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get all certificates for the authenticated user' })
  findMine(@CurrentUser('id') userId: string) {
    return this.certificateService.findByUser(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all certificates for a user' })
  findByUser(
    @Param('userId') userId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    this.ensureOwnUserScope(userId, currentUserId);
    return this.certificateService.findByUser(userId);
  }

  @Public()
  @Get('verify/:certificateNumber')
  @ApiOperation({ summary: 'Verify certificate by number' })
  verifyByNumber(@Param('certificateNumber') certificateNumber: string) {
    return this.certificateService.verifyByNumber(certificateNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get certificate by id' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.certificateService.findOneForUser(id, userId);
  }

  private ensureOwnUserScope(userId: string, currentUserId: string) {
    if (!currentUserId || userId !== currentUserId) {
      throw new ForbiddenException("You cannot access another user's data");
    }
  }
}
