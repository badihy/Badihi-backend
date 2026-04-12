import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

@ApiTags('Certificate')
@ApiBearerAuth('JWT-access')
@Controller('certificate')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) { }

  @Post('issue')
  @ApiOperation({ summary: 'Issue certificate after course completion' })
  issue(@Body() issueCertificateDto: IssueCertificateDto) {
    return this.certificateService.issue(issueCertificateDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all certificates for a user' })
  findByUser(@Param('userId') userId: string) {
    return this.certificateService.findByUser(userId);
  }

  @Get('verify/:certificateNumber')
  @ApiOperation({ summary: 'Verify certificate by number' })
  verifyByNumber(@Param('certificateNumber') certificateNumber: string) {
    return this.certificateService.verifyByNumber(certificateNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get certificate by id' })
  findOne(@Param('id') id: string) {
    return this.certificateService.findOne(id);
  }
}
