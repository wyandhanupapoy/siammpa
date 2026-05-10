import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitValidationDto {
  @IsBoolean()
  criteria1: boolean;

  @IsBoolean()
  criteria2: boolean;

  @IsBoolean()
  criteria3: boolean;

  @IsBoolean()
  criteria4: boolean;

  @IsBoolean()
  criteria5: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsString()
  decision: 'VERIFIED' | 'REJECTED';
}
