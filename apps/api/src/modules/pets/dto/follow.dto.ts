import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FollowDto {
  @ApiProperty({
    description: 'ID of the pet that will follow',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  followerPetId: string;

  @ApiProperty({
    description: 'ID of the pet to follow',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  followingPetId: string;
}
