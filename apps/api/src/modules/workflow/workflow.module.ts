import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';

@Module({
  imports: [NotificationModule, AuditModule, QuestionnaireModule],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
