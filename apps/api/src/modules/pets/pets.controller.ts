import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { SearchPetsDto } from './dto/search-pets.dto';
import { FollowDto } from './dto/follow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Pets')
@Controller('pets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pet profile' })
  @ApiResponse({
    status: 201,
    description: 'Pet profile created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Maximum pets limit reached',
  })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePetDto,
  ) {
    return this.petsService.create(user.sub, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user pets' })
  @ApiResponse({
    status: 200,
    description: 'List of user pets',
  })
  async getMyPets(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.petsService.findByOwner(user.sub, pagination);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested pets to follow' })
  @ApiResponse({
    status: 200,
    description: 'List of suggested pets',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSuggestions(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ) {
    return this.petsService.getSuggestions(user.sub, limit || 10);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search pets' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  async search(@Query() dto: SearchPetsDto) {
    const { query, species, country, page, limit } = dto;
    return this.petsService.search(
      query || '',
      { species, country },
      { page, limit } as PaginationDto,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get pet profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Pet profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Pet not found',
  })
  async getProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.petsService.getProfile(id, user?.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pet profile' })
  @ApiResponse({
    status: 200,
    description: 'Pet profile updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only update your own pets',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePetDto,
  ) {
    return this.petsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete pet profile' })
  @ApiResponse({
    status: 200,
    description: 'Pet profile deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only delete your own pets',
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.petsService.delete(id, user.sub);
    return { message: 'Pet deleted successfully' };
  }

  // Follow endpoints
  @Post('follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a pet' })
  @ApiResponse({
    status: 200,
    description: 'Successfully followed',
  })
  async follow(
    @CurrentUser() user: JwtPayload,
    @Body() dto: FollowDto,
  ) {
    await this.petsService.follow(dto.followerPetId, dto.followingPetId, user.sub);
    return { message: 'Successfully followed' };
  }

  @Post('unfollow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a pet' })
  @ApiResponse({
    status: 200,
    description: 'Successfully unfollowed',
  })
  async unfollow(
    @CurrentUser() user: JwtPayload,
    @Body() dto: FollowDto,
  ) {
    await this.petsService.unfollow(dto.followerPetId, dto.followingPetId, user.sub);
    return { message: 'Successfully unfollowed' };
  }

  @Get(':id/followers')
  @Public()
  @ApiOperation({ summary: 'Get pet followers' })
  @ApiResponse({
    status: 200,
    description: 'List of followers',
  })
  async getFollowers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.petsService.getFollowers(id, pagination);
  }

  @Get(':id/following')
  @Public()
  @ApiOperation({ summary: 'Get pets that this pet is following' })
  @ApiResponse({
    status: 200,
    description: 'List of following',
  })
  async getFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.petsService.getFollowing(id, pagination);
  }
}
