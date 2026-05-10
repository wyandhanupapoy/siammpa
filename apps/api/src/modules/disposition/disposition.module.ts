import { Module } from '@nestjs/common';
import { DispositionService } from './disposition.service';
import { DispositionController } from './disposition.controller';
import { WorkflowModule } from '../workflow/workflow.module';
import { PdfModule } from '../pdf/pdf.module';
import { AspirationModule } from '../aspiration/aspiration.module';

@Module({
  imports: [WorkflowModule, PdfModule, AspirationModule],
  providers: [DispositionService],
  controllers: [DispositionController],
})
export class DispositionModule {}
