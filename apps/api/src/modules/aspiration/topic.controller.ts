import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TopicService } from './topic.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get()
  async findAll() {
    return this.topicService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.topicService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateTopicDto) {
    return this.topicService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.topicService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.topicService.remove(id);
  }

  @Post(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body('aspirationIds') aspirationIds: string[],
  ) {
    return this.topicService.assignAspirations(id, aspirationIds);
  }

  @Post(':id/analysis')
  async saveAnalysis(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req,
  ) {
    return this.topicService.saveAnalysis(id, req.user.id, data);
  }
}
