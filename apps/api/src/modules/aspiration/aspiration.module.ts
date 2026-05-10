import { Module } from '@nestjs/common';
import { AspirationService } from './aspiration.service';
import { AspirationController } from './aspiration.controller';
import { MonitoringController } from './monitoring.controller';
import { InternalCommentController } from './internal-comment.controller';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { EncryptionService } from '../auth/encryption.service';

@Module({
  imports: [WorkflowModule, AuthModule, StorageModule, PrismaModule],
  providers: [AspirationService, TopicService, ReportService, EncryptionService],
  controllers: [
    AspirationController,
    MonitoringController,
    InternalCommentController,
    TopicController,
    ReportController,
  ],
  exports: [AspirationService],
})
export class AspirationModule {}
