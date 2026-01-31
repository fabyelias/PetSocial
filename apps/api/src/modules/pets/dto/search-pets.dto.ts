import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PetSpecies } from '@/database/entities/pet.entity';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class SearchPetsDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'golden',
    description: 'Search query (searches name and bio)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @ApiPropertyOptional({
    enum: PetSpecies,
    description: 'Filter by species',
  })
  @IsOptional()
  @IsEnum(PetSpecies)
  species?: PetSpecies;

  @ApiPropertyOptional({
    example: 'United States',
    description: 'Filter by country',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
