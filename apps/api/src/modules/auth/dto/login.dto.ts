import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  // NIM or Email as per PRD FR-01-02
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
