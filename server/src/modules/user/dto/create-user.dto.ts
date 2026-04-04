import { UserRole } from '@root/generated/prisma/enums';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters' })
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(UserRole)
  @IsString()
  role: UserRole;
}
