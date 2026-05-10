import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ValidationService } from './validation.service';
import { SubmitValidationDto } from './dto/submit-validation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('aspirations/:id/validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async validate(
    @Param('id') id: string,
    @Body() dto: SubmitValidationDto,
    @Request() req,
  ) {
    return this.validationService.validate(id, dto, req.user.id);
  }
}
