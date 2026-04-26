import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../app.module';
import { User, UserDocument } from '../user/schemas/user.schema';
import { UserRole } from '../auth/enums/user-role.enum';

type AdminSeed = {
  email: string;
  username: string;
  fullName: string;
  phone: string;
};

/** Default admins (idempotent upsert by email). */
const DEFAULT_ADMINS: AdminSeed[] = [
  {
    email: 'admin@badihy.com',
    username: 'badihy_admin',
    fullName: 'Badihy Admin',
    phone: '01000000001',
  },
  {
    email: 'superadmin@badihy.com',
    username: 'badihy_superadmin',
    fullName: 'Badihy Super Admin',
    phone: '01000000000',
  },
];

function parseExtraAdminsFromEnv(): AdminSeed[] {
  const raw = process.env.SEED_ADMIN_EMAILS?.trim();
  if (!raw) return [];

  return raw.split(',').map((email, index) => {
    const trimmed = email.trim().toLowerCase();
    const local = trimmed.split('@')[0]?.replace(/[^a-z0-9_]/gi, '_') || 'admin';
    return {
      email: trimmed,
      username: `${local}_seed_${index}`,
      fullName: `Admin (${trimmed})`,
      phone: `010000000${String(10 + index).slice(-2)}`,
    };
  });
}

async function bootstrap() {
  const password =
    process.env.SEED_ADMIN_PASSWORD?.trim() || 'password123';
  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters');
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const seeds = [...DEFAULT_ADMINS, ...parseExtraAdminsFromEnv()];
    const seen = new Set<string>();

    console.log('Seeding admin users (upsert by email)...');

    for (const seed of seeds) {
      if (seen.has(seed.email)) continue;
      seen.add(seed.email);

      const doc = await userModel.findOneAndUpdate(
        { email: seed.email },
        {
          $set: {
            fullName: seed.fullName,
            phone: seed.phone,
            role: UserRole.ADMIN,
            isVerified: true,
            password: hashedPassword,
          },
          $setOnInsert: {
            username: seed.username,
            email: seed.email,
          },
        },
        { upsert: true, new: true },
      );

      console.log(
        `  OK: ${doc.email} (${doc.role}) username=${doc.username}`,
      );
    }

    const adminCount = await userModel.countDocuments({
      role: UserRole.ADMIN,
    });
    console.log(`Done. Total admin users in database: ${adminCount}`);
    console.log(
      'Login with any seeded email and the password from SEED_ADMIN_PASSWORD (default: password123).',
    );
  } catch (error) {
    console.error('Admin seed failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
