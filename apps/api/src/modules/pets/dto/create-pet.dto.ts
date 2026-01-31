import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PetSpecies } from '@/database/entities/pet.entity';

export class CreatePetDto {
  @ApiProperty({
    example: 'Max',
    description: 'Pet name',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    enum: PetSpecies,
    example: PetSpecies.DOG,
    description: 'Pet species',
  })
  @IsEnum(PetSpecies)
  species: PetSpecies;

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
