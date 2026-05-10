import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [WorkflowModule],
  providers: [SlaService],
})
export class SlaModule {}
