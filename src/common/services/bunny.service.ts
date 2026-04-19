import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from '@nestjs/common';

@Injectable()
export class BunnyService {
    private readonly logger = new Logger(BunnyService.name);
    private readonly storageZone: string;
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly timeout: number;

    constructor(private configService: ConfigService) {
        this.storageZone = this.configService.get<string>('BUNNY_STORAGE_ZONE', 'badihy');
        this.apiKey = this.configService.get<string>('BUNNY_STORAGE_KEY') || '';
        this.baseUrl = `https://storage.bunnycdn.com/${this.storageZone}`;
        this.timeout = Number(this.configService.get<string>('BUNNY_TIMEOUT_MS') || '90000');

        if (!this.apiKey) {
            this.logger.warn('مفتاح BUNNY_STORAGE_KEY غير مُكوّن. ستفشل عمليات تحميل الملفات.');
        }
    }

    private async makeRequest(config: AxiosRequestConfig, retries: number = 3): Promise<any> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                this.logger.debug(`Attempt ${attempt}/${retries} - Making request to ${config.url}`);

                const response = await axios({
                    ...config,
                    timeout: this.timeout,
                    headers: {
                        'User-Agent': 'Dukan-API/1.0',
                        ...config.headers,
                    },
                });

                return response;
            } catch (error) {
                this.logger.warn(`Attempt ${attempt}/${retries} failed: ${error.message}`);

                if (attempt === retries) {
                    throw error;
                }

                // Wait before retry (exponential backoff)
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        this.ensureApiKeyConfigured();
        this.ensureValidFile(file);

        const fileName = Date.now() + '-' + file.originalname;
        const uploadUrl = `${this.baseUrl}/${fileName}`;

        try {
            this.logger.log(`Uploading file: ${fileName} (${file.size} bytes)`);

            await this.makeRequest({
                method: 'PUT',
                url: uploadUrl,
                data: file.buffer,
                headers: {
                    'AccessKey': this.apiKey,
                    'Content-Type': file.mimetype,
                },
            });

            const cdnUrl = `https://${this.storageZone}.b-cdn.net/${fileName}`;
            this.logger.log(`File uploaded successfully: ${cdnUrl}`);
            return cdnUrl;

        } catch (error: any) {
            this.logger.error(`File upload failed for ${fileName}:`, error?.message);

            const isTimeout =
                error?.code === 'ETIMEDOUT' ||
                error?.code === 'ECONNABORTED' ||
                (typeof error?.message === 'string' && error.message.toLowerCase().includes('timeout'));

            if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
                throw new ServiceUnavailableException('فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
            } else if (isTimeout) {
                throw new ServiceUnavailableException('انتهت مهلة رفع الملف. جرّب مرة أخرى أو استخدم ملفاً أصغر.');
            } else if (error?.response?.status === 401) {
                throw new InternalServerErrorException('مفتاح API الخاص بـ BunnyCDN غير صحيح. يرجى التحقق من الإعدادات.');
            } else if (error?.response?.status === 404) {
                throw new InternalServerErrorException('منطقة التخزين غير موجودة. يرجى التحقق من إعدادات BunnyCDN.');
            } else {
                throw new InternalServerErrorException(`فشل تحميل الملف: ${error?.message || ''}`);
            }
        }
    }

    async uploadVideo(file: Express.Multer.File): Promise<string> {
        this.ensureApiKeyConfigured();
        this.ensureValidFile(file);

        try {
            const uploadUrl = `${this.baseUrl}/${file.originalname}`;

            this.logger.log(`Uploading video: ${file.originalname} (${file.size} bytes)`);

            await this.makeRequest({
                method: 'PUT',
                url: uploadUrl,
                data: file.buffer,
                headers: {
                    'AccessKey': this.apiKey,
                    'Content-Type': file.mimetype,
                },
            });

            const cdnUrl = `https://${this.storageZone}.b-cdn.net/${file.originalname}`;
            this.logger.log(`Video uploaded successfully: ${cdnUrl}`);
            return cdnUrl;

        } catch (error: any) {
            this.logger.error(`Video upload failed for ${file.originalname}:`, error.message);
            throw new InternalServerErrorException(`فشل تحميل الفيديو على Bunny.net: ${error.message}`);
        }
    }

    async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
        this.ensureApiKeyConfigured();

        if (!files || files.length === 0) {
            throw new BadRequestException('لم يتم تقديم ملفات');
        }

        const uploadPromises = files.map(async (file) => {
            this.ensureValidFile(file, `ملف غير صحيح: ${file?.originalname || 'غير معروف'}`);

            const uploadUrl = `${this.baseUrl}/${file.originalname}`;
            try {
                this.logger.log(`Uploading file: ${file.originalname} (${file.size} bytes)`);

                await this.makeRequest({
                    method: 'PUT',
                    url: uploadUrl,
                    data: file.buffer,
                    headers: {
                        'AccessKey': this.apiKey,
                        'Content-Type': file.mimetype,
                    },
                });

                const cdnUrl = `https://${this.storageZone}.b-cdn.net/${file.originalname}`;
                this.logger.log(`File uploaded successfully: ${cdnUrl}`);
                return cdnUrl;

            } catch (error: any) {
                this.logger.error(`File upload failed for ${file.originalname}:`, error.message);
                throw new InternalServerErrorException(`فشل تحميل الملف: ${error.message}`);
            }
        });

        return Promise.all(uploadPromises);
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!this.apiKey) {
            throw new InternalServerErrorException('مفتاح API الخاص بـ BunnyCDN غير مُكوّن');
        }

        if (!fileUrl) {
            throw new InternalServerErrorException('عنوان URL للملف مطلوب');
        }

        try {
            const fileName = fileUrl.split('/').pop();

            if (!fileName) {
                throw new InternalServerErrorException('عنوان URL للملف غير صحيح - لا يمكن استخراج اسم الملف');
            }

            const deleteUrl = `${this.baseUrl}/${fileName}`;

            await this.makeRequest({
                method: 'DELETE',
                url: deleteUrl,
                headers: {
                    'AccessKey': this.apiKey,
                },
            });
        } catch (error) {
            this.logger.error(`File deletion failed for ${fileUrl}:`, error.message);
            throw new InternalServerErrorException(`فشل حذف الملف`);
        }
    }

    async removeFileIfExists(fileUrl?: string | null): Promise<void> {
        if (!fileUrl) {
            return;
        }

        try {
            await this.deleteFile(fileUrl);
        } catch (error: any) {
            this.logger.warn(`Skipping file cleanup for ${fileUrl}: ${error?.message || error}`);
        }
    }

    private ensureApiKeyConfigured() {
        if (!this.apiKey) {
            throw new InternalServerErrorException('مفتاح API الخاص بـ BunnyCDN غير مُكوّن');
        }
    }

    private ensureValidFile(file?: Express.Multer.File, message = 'الملف المقدم غير صحيح') {
        if (!file || !file.buffer) {
            throw new BadRequestException(message);
        }
    }

}
