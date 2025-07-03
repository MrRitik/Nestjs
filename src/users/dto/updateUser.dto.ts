import {
  IsString,
  IsEmail,
  MinLength,
  Length,
  IsOptional,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
  username!: string;

  @IsOptional()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
