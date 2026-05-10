import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { HearingService } from './hearing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('aspirations/:aspirationId/hearings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA')
export class HearingController {
  constructor(private readonly hearingService: HearingService) {}

  @Post()
  async create(@Param('aspirationId') aspirationId: string, @Body() data: any) {
    return this.hearingService.create(aspirationId, data);
  }

  @Get()
  async findAll(@Param('aspirationId') aspirationId: string) {
    return this.hearingService.findAll(aspirationId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.hearingService.update(id, data);
  }
}
