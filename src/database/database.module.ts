import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>('MONGO_URI'),
                dbName: 'Badihi',
                appName: 'Badihi',
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [],
    exports: [],
})
export class DatabaseModule {
    logger!: Logger;
    constructor() {
        this.logger = new Logger(DatabaseModule.name);
    }
    onModuleInit() {
        this.logger.log('DatabaseModule initialized successfully');
    }
}
