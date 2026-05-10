import { Module } from '@nestjs/common';
import { HearingService } from './hearing.service';
import { HearingController } from './hearing.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HearingService],
  controllers: [HearingController],
})
export class HearingModule {}
