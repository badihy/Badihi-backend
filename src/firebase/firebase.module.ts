import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Module({
    providers: [
        Logger,
        {
            provide: 'FIREBASE_ADMIN',
            inject: [ConfigService, Logger],
            useFactory: (config: ConfigService, logger: Logger) => {
                const projectId = config.getOrThrow<string>('FIREBASE_PROJECT_ID');
                const clientEmail = config.getOrThrow<string>('FIREBASE_CLIENT_EMAIL');
                const privateKey = config.getOrThrow<string>('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
                    });
                }
                logger.log('Firebase initialized');
                return admin;
            },
        },
    ],
    exports: ['FIREBASE_ADMIN']
})
export class FirebaseModule { }
