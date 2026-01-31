import {
  IsString,
  IsOptional,
  MaxLength,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePetDto {
  @ApiPropertyOptional({
    example: 'Max',
    description: 'Pet name',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    example: 'Golden Retriever',
    description: 'Pet breed',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  breed?: string;

  @ApiPropertyOptional({
    example: '2020-05-15',
    description: 'Pet birth date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'A playful golden retriever who loves fetch!',
    description: 'Pet biography',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    description: 'Cover image URL',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  coverUrl?: string;

  @ApiPropertyOptional({
    example: 'New York',
    description: 'City location',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  locationCity?: string;

  @ApiPropertyOptional({
    example: 'United States',
    description: 'Country location',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  locationCountry?: string;
}
