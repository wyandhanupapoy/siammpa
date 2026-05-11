import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAspirationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  // These might be needed for the "Identitas" step if not logged in
  @IsOptional()
  @IsString()
  nim?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  attachments?: {
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }[];
}
