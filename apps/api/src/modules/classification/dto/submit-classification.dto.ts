import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class SubmitClassificationDto {
  @IsInt()
  @Min(1)
  @Max(5)
  param1: number; // Jumlah Terdampak

  @IsInt()
  @Min(1)
  @Max(5)
  param2: number; // Urgensi Waktu

  @IsInt()
  @Min(1)
  @Max(5)
  param3: number; // Dampak Akademik

  @IsInt()
  @Min(1)
  @Max(5)
  param4: number; // Sensitivitas

  @IsInt()
  @Min(1)
  @Max(5)
  param5: number; // Kelengkapan Bukti

  @IsInt()
  @Min(1)
  @Max(5)
  param6: number; // Pengulangan

  @IsOptional()
  @IsString()
  notes?: string;
}
