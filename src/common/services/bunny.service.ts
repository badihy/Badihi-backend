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
            this.logger.warn('BUNNY_API_KEY not configured. File uploads will fail.');
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
            throw new Error('BunnyCDN API key not configured');
        }

        if (!file || !file.buffer) {
            throw new Error('Invalid file provided');
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
                throw new Error('Network connection failed. Please check your internet connection and try again.');
            } else if (error.code === 'ETIMEDOUT') {
                throw new Error('Upload timeout. The file may be too large or the connection is slow.');
            } else if (error.response?.status === 401) {
                throw new Error('Invalid BunnyCDN API key. Please check your configuration.');
            } else if (error.response?.status === 404) {
                throw new Error('Storage zone not found. Please check your BunnyCDN configuration.');
            } else {
                throw new Error(`File upload failed: ${error.message}`);
            }
        }
    }

    async uploadVideo(file: Express.Multer.File): Promise<string> {
        if (!this.apiKey) {
            throw new Error('BunnyCDN API key not configured');
        }

        if (!file || !file.buffer) {
            throw new Error('Invalid file provided');
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
            throw new Error(`Bunny.net upload failed: ${error.message}`);
        }
    }

    async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
        if (!this.apiKey) {
            throw new Error('BunnyCDN API key not configured');
        }

        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        const uploadPromises = files.map(async (file) => {
            if (!file || !file.buffer) {
                throw new Error(`Invalid file: ${file?.originalname || 'unknown'}`);
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
                throw new Error(`File upload failed: ${error.message}`);
            }
        });

        return Promise.all(uploadPromises);
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!this.apiKey) {
            throw new InternalServerErrorException('BunnyCDN API key not configured');
        }

        if (!fileUrl) {
            throw new InternalServerErrorException('File URL is required');
        }

        try {
            const fileName = fileUrl.split('/').pop();

            if (!fileName) {
                throw new InternalServerErrorException('Invalid file URL - could not extract filename');
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
            throw new InternalServerErrorException(`File deletion failed`);
        }
    }

}
