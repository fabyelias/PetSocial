import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@/database/entities/user.entity';

export class UpdateStatusDto {
  @ApiProperty({
    enum: UserStatus,
    description: 'New user status',
    example: UserStatus.SUSPENDED,
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
