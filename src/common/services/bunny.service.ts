import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from '@nestjs/common';

@Injectable()
export class BunnyService {
    private readonly logger = new Logger(BunnyService.name);
    private readonly storageZone: string;
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly timeout: number = 30000;

    constructor(private configService: ConfigService) {
        this.storageZone = this.configService.get<string>('BUNNY_STORAGE_ZONE', 'bsohula');
        this.apiKey = this.configService.get<string>('BUNNY_STORAGE_KEY', 'c7fbeb57-331c-4510-a04d979b0515-1729-4670');
        this.baseUrl = `https://storage.bunnycdn.com/${this.storageZone}`;

        if (!this.apiKey) {
            this.logger.warn('مفتاح BUNNY_API_KEY غير مُكوّن. ستفشل عمليات تحميل الملفات.');
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
        if (!this.apiKey) {
            throw new Error('مفتاح API الخاص بـ BunnyCDN غير مُكوّن');
        }

        if (!file || !file.buffer) {
            throw new Error('الملف المقدم غير صحيح');
        }

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

        } catch (error) {
            this.logger.error(`File upload failed for ${fileName}:`, error.message);

            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw new Error('فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
            } else if (error.code === 'ETIMEDOUT') {
                throw new Error('انتهت مهلة التحميل. قد يكون الملف كبيراً جداً أو الاتصال بطيئاً.');
            } else if (error.response?.status === 401) {
                throw new Error('مفتاح API الخاص بـ BunnyCDN غير صحيح. يرجى التحقق من الإعدادات.');
            } else if (error.response?.status === 404) {
                throw new Error('منطقة التخزين غير موجودة. يرجى التحقق من إعدادات BunnyCDN.');
            } else {
                throw new Error(`فشل تحميل الملف: ${error.message}`);
            }
        }
    }

    async uploadVideo(file: Express.Multer.File): Promise<string> {
        if (!this.apiKey) {
            throw new Error('مفتاح API الخاص بـ BunnyCDN غير مُكوّن');
        }

        if (!file || !file.buffer) {
            throw new Error('الملف المقدم غير صحيح');
        }

        try {
            const uploadUrl = `${this.baseUrl}/${file.originalname}`;

            this.logger.log(`Uploading video: ${file.originalname} (${file.size} bytes)`);

            const response = await this.makeRequest({
                method: 'PUT',
                url: uploadUrl,
                data: file.buffer,
                headers: {
                    'AccessKey': this.apiKey,
                    'Content-Type': file.mimetype,
                },
            });

            console.log(response);

            const cdnUrl = `https://${this.storageZone}.b-cdn.net/${file.originalname}`;
            this.logger.log(`Video uploaded successfully: ${cdnUrl}`);
            return cdnUrl;

        } catch (error) {
            this.logger.error(`Video upload failed for ${file.originalname}:`, error.message);
            throw new Error(`فشل تحميل الفيديو على Bunny.net: ${error.message}`);
        }
    }

    async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
        if (!this.apiKey) {
            throw new Error('مفتاح API الخاص بـ BunnyCDN غير مُكوّن');
        }

        if (!files || files.length === 0) {
            throw new Error('لم يتم تقديم ملفات');
        }

        const uploadPromises = files.map(async (file) => {
            if (!file || !file.buffer) {
                throw new Error(`ملف غير صحيح: ${file?.originalname || 'غير معروف'}`);
            }

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

            } catch (error) {
                this.logger.error(`File upload failed for ${file.originalname}:`, error.message);
                throw new Error(`فشل تحميل الملف: ${error.message}`);
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

}
