import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateDispositionDto {
  @IsNotEmpty()
  @IsString()
  sentTo: string;

  @IsNotEmpty()
  @IsString()
  summary: string;

  @IsNotEmpty()
  @IsString()
  recommendation: string;

  @IsNotEmpty()
  @IsDateString()
  deadline: string;
}
