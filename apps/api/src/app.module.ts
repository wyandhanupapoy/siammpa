import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AspirationModule } from './modules/aspiration/aspiration.module';
import { CategoryModule } from './modules/category/category.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { ValidationModule } from './modules/validation/validation.module';
import { ClassificationModule } from './modules/classification/classification.module';
import { DispositionModule } from './modules/disposition/disposition.module';
import { SlaModule } from './modules/sla/sla.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { AuditModule } from './modules/audit/audit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HearingModule } from './modules/hearing/hearing.module';
import { QuestionnaireModule } from './modules/questionnaire/questionnaire.module';
import { NewsModule } from './modules/news/news.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
    AuthModule,
    AspirationModule,
    CategoryModule,
    WorkflowModule,
    ValidationModule,
    ClassificationModule,
    DispositionModule,
    SlaModule,
    NotificationModule,
    PdfModule,
    AuditModule,
    AnalyticsModule,
    HearingModule,
    QuestionnaireModule,
    NewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
