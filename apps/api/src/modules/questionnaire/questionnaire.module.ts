import { Module } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireAnalysisService } from './analysis.service';
import { QuestionnaireImportService } from './import.service';
import { QuestionnaireController } from './questionnaire.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    QuestionnaireService,
    QuestionnaireAnalysisService,
    QuestionnaireImportService,
  ],
  controllers: [QuestionnaireController],
  exports: [QuestionnaireService],
})
export class QuestionnaireModule {}
