import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { Pet } from '@/database/entities/pet.entity';
import { Follow } from '@/database/entities/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, Follow])],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService],
})
export class PetsModule {}
