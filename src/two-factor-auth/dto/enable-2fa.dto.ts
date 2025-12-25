import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Enable2FADto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  verificationCode: string;
}
