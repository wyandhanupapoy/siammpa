import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { SubmitClassificationDto } from './dto/submit-classification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('aspirations/:id/classification')
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async classify(
    @Param('id') id: string,
    @Body() dto: SubmitClassificationDto,
    @Request() req,
  ) {
    return this.classificationService.classify(id, dto, req.user.id);
  }
}
