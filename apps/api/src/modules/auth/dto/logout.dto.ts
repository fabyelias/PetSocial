import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Refresh token to revoke (optional - if not provided, only current session ends)',
    example: 'a1b2c3d4e5f6...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
