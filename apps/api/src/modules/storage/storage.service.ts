import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_KEY');

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
    if (!this.supabase) {
      this.logger.warn('Supabase not configured, skipping upload');
      return 'local-placeholder-path';
    }

    const bucket = this.configService.get<string>(
      'SUPABASE_BUCKET',
      'aspirasi-attachments',
    );

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload file to Supabase: ${error.message}`);
      throw new InternalServerErrorException(
        `Gagal mengunggah file: ${error.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(bucket).getPublicUrl(path);

    return publicUrl;
  }
}
