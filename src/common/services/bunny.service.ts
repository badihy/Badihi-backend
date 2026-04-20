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
    this.storageZone = this.configService.get<string>(
      'BUNNY_STORAGE_ZONE',
      'badihy',
    );
    this.apiKey = this.configService.get<string>('BUNNY_STORAGE_KEY') || '';
    this.baseUrl = `https://storage.bunnycdn.com/${this.storageZone}`;
    this.timeout = Number(
      this.configService.get<string>('BUNNY_TIMEOUT_MS') || '90000',
    );

    if (!this.apiKey) {
      this.logger.warn(
        'BUNNY_STORAGE_KEY is not configured. File uploads will fail.',
      );
    }
  }

  private async makeRequest(
    config: AxiosRequestConfig,
    retries: number = 3,
  ): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.debug(
          `Attempt ${attempt}/${retries} - Making request to ${config.url}`,
        );

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
        this.logger.warn(
          `Attempt ${attempt}/${retries} failed: ${error.message}`,
        );

        if (attempt === retries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
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
          AccessKey: this.apiKey,
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
        (typeof error?.message === 'string' &&
          error.message.toLowerCase().includes('timeout'));

      if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException(
          'Network connection failed. Please check your internet connection and try again.',
        );
      } else if (isTimeout) {
        throw new ServiceUnavailableException(
          'File upload timed out. Try again or use a smaller file.',
        );
      } else if (error?.response?.status === 401) {
        throw new InternalServerErrorException(
          'The BunnyCDN API key is invalid. Please check the configuration.',
        );
      } else if (error?.response?.status === 404) {
        throw new InternalServerErrorException(
          'The storage zone was not found. Please check the BunnyCDN settings.',
        );
      } else {
        throw new InternalServerErrorException(
          `File upload failed: ${error?.message || ''}`,
        );
      }
    }
  }

  async uploadVideo(file: Express.Multer.File): Promise<string> {
    this.ensureApiKeyConfigured();
    this.ensureValidFile(file);

    try {
      const uploadUrl = `${this.baseUrl}/${file.originalname}`;

      this.logger.log(
        `Uploading video: ${file.originalname} (${file.size} bytes)`,
      );

      await this.makeRequest({
        method: 'PUT',
        url: uploadUrl,
        data: file.buffer,
        headers: {
          AccessKey: this.apiKey,
          'Content-Type': file.mimetype,
        },
      });

      const cdnUrl = `https://${this.storageZone}.b-cdn.net/${file.originalname}`;
      this.logger.log(`Video uploaded successfully: ${cdnUrl}`);
      return cdnUrl;
    } catch (error: any) {
      this.logger.error(
        `Video upload failed for ${file.originalname}:`,
        error.message,
      );
      throw new InternalServerErrorException(
        `Failed to upload video to Bunny.net: ${error.message}`,
      );
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    this.ensureApiKeyConfigured();

    if (!files || files.length === 0) {
      throw new BadRequestException('No files were provided');
    }

    const uploadPromises = files.map(async (file) => {
      this.ensureValidFile(
        file,
        `Invalid file: ${file?.originalname || 'unknown'}`,
      );

      const uploadUrl = `${this.baseUrl}/${file.originalname}`;
      try {
        this.logger.log(
          `Uploading file: ${file.originalname} (${file.size} bytes)`,
        );

        await this.makeRequest({
          method: 'PUT',
          url: uploadUrl,
          data: file.buffer,
          headers: {
            AccessKey: this.apiKey,
            'Content-Type': file.mimetype,
          },
        });

        const cdnUrl = `https://${this.storageZone}.b-cdn.net/${file.originalname}`;
        this.logger.log(`File uploaded successfully: ${cdnUrl}`);
        return cdnUrl;
      } catch (error: any) {
        this.logger.error(
          `File upload failed for ${file.originalname}:`,
          error.message,
        );
        throw new InternalServerErrorException(
          `File upload failed: ${error.message}`,
        );
      }
    });

    return Promise.all(uploadPromises);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'The BunnyCDN API key is not configured',
      );
    }

    if (!fileUrl) {
      throw new InternalServerErrorException('File URL is required');
    }

    try {
      const fileName = fileUrl.split('/').pop();

      if (!fileName) {
        throw new InternalServerErrorException(
          'Invalid file URL. The file name could not be extracted',
        );
      }

      const deleteUrl = `${this.baseUrl}/${fileName}`;

      await this.makeRequest({
        method: 'DELETE',
        url: deleteUrl,
        headers: {
          AccessKey: this.apiKey,
        },
      });
    } catch (error) {
      this.logger.error(`File deletion failed for ${fileUrl}:`, error.message);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async removeFileIfExists(fileUrl?: string | null): Promise<void> {
    if (!fileUrl) {
      return;
    }

    try {
      await this.deleteFile(fileUrl);
    } catch (error: any) {
      this.logger.warn(
        `Skipping file cleanup for ${fileUrl}: ${error?.message || error}`,
      );
    }
  }

  private ensureApiKeyConfigured() {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'The BunnyCDN API key is not configured',
      );
    }
  }

  private ensureValidFile(
    file?: Express.Multer.File,
    message = 'The provided file is invalid',
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException(message);
    }
  }
}
