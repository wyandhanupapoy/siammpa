import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [NewsController],
})
export class NewsModule {
  constructor() {
    console.log('NewsModule initialized');
  }
}
