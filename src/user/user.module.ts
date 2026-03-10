import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'src/common/services/email.service';
import { AuthModule } from '../auth/auth.module';
import { BunnyService } from 'src/common/services/bunny.service';
import { Enrollment, EnrollmentSchema } from '../courses/schemas/enrollment.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { Certificate, CertificateSchema } from '../certificate/schemas/certificate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Certificate.name, schema: CertificateSchema },
    ]),
    JwtModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, EmailService, BunnyService],
  exports: [UserService],
})
export class UserModule { }
