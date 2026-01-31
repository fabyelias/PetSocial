import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';

import { Pet, PetSpecies } from '@/database/entities/pet.entity';
import { Follow } from '@/database/entities/follow.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PaginationDto, PaginatedResult } from '@/common/dto/pagination.dto';

const MAX_PETS_PER_USER = 10;

@Injectable()
export class PetsService {
  private readonly logger = new Logger(PetsService.name);

  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async create(userId: string, dto: CreatePetDto): Promise<Pet> {
    // Check pet limit
    const petCount = await this.petRepository.count({
      where: { ownerId: userId },
    });

    if (petCount >= MAX_PETS_PER_USER) {
      throw new BadRequestException(
        `Maximum ${MAX_PETS_PER_USER} pets per user allowed`,
      );
    }

    const pet = this.petRepository.create({
      ...dto,
      ownerId: userId,
    });

    await this.petRepository.save(pet);

    this.logger.log(`Pet created: ${pet.name} (${pet.id}) by user ${userId}`);

    return pet;
  }

  async findById(id: string): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }

  async findByOwner(
    ownerId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Pet>> {
    const [items, total] = await this.petRepository.findAndCount({
      where: { ownerId },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return {
      items,
      total,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    };
  }

  async update(petId: string, userId: string, dto: UpdatePetDto): Promise<Pet> {
    const pet = await this.findById(petId);

    // Verify ownership
    if (pet.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own pets');
    }

    // Update fields
    Object.assign(pet, dto);
    await this.petRepository.save(pet);

    this.logger.log(`Pet updated: ${pet.name} (${pet.id})`);

    return pet;
  }

  async delete(petId: string, userId: string): Promise<void> {
    const pet = await this.findById(petId);

    // Verify ownership
    if (pet.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own pets');
    }

    await this.petRepository.softRemove(pet);

    this.logger.log(`Pet deleted: ${pet.name} (${pet.id})`);
  }

  async getProfile(petId: string, viewerId?: string): Promise<Pet & { isFollowing?: boolean }> {
    const pet = await this.petRepository.findOne({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Check if viewer is following this pet
    let isFollowing: boolean | undefined;
    if (viewerId) {
      const viewerPets = await this.petRepository.find({
        where: { ownerId: viewerId },
        select: ['id'],
      });
      const viewerPetIds = viewerPets.map((p) => p.id);

      if (viewerPetIds.length > 0) {
        const followExists = await this.followRepository.findOne({
          where: {
            followerId: In(viewerPetIds),
            followingId: petId,
          },
        });
        isFollowing = !!followExists;
      }
    }

    return { ...pet, isFollowing };
  }

  // Follow system
  async follow(followerPetId: string, followingPetId: string, userId: string): Promise<void> {
    // Verify ownership of follower pet
    const followerPet = await this.findById(followerPetId);
    if (followerPet.ownerId !== userId) {
      throw new ForbiddenException('You can only manage follows for your own pets');
    }

    // Can't follow yourself
    if (followerPetId === followingPetId) {
      throw new BadRequestException('A pet cannot follow itself');
    }

    // Check if following pet exists
    const followingPet = await this.findById(followingPetId);

    // Check if already following
    const existingFollow = await this.followRepository.findOne({
      where: {
        followerId: followerPetId,
        followingId: followingPetId,
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Already following this pet');
    }

    // Create follow
    const follow = this.followRepository.create({
      followerId: followerPetId,
      followingId: followingPetId,
    });

    await this.followRepository.save(follow);

    // Update counts
    await this.petRepository.increment({ id: followerPetId }, 'followingCount', 1);
    await this.petRepository.increment({ id: followingPetId }, 'followersCount', 1);

    this.logger.log(`Pet ${followerPetId} followed ${followingPetId}`);
  }

  async unfollow(followerPetId: string, followingPetId: string, userId: string): Promise<void> {
    // Verify ownership
    const followerPet = await this.findById(followerPetId);
    if (followerPet.ownerId !== userId) {
      throw new ForbiddenException('You can only manage follows for your own pets');
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: followerPetId,
        followingId: followingPetId,
      },
    });

    if (!follow) {
      throw new BadRequestException('Not following this pet');
    }

    await this.followRepository.remove(follow);

    // Update counts
    await this.petRepository.decrement({ id: followerPetId }, 'followingCount', 1);
    await this.petRepository.decrement({ id: followingPetId }, 'followersCount', 1);

    this.logger.log(`Pet ${followerPetId} unfollowed ${followingPetId}`);
  }

  async getFollowers(
    petId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Pet>> {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { followingId: petId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const items = follows.map((f) => f.follower);

    return {
      items,
      total,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    };
  }

  async getFollowing(
    petId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Pet>> {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { followerId: petId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const items = follows.map((f) => f.following);

    return {
      items,
      total,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    };
  }

  // Search and discovery
  async search(
    query: string,
    filters: { species?: PetSpecies; country?: string },
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Pet>> {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pet')
      .where('pet.deletedAt IS NULL')
      .andWhere('pet.isActive = :isActive', { isActive: true });

    // Text search on name and bio
    if (query) {
      queryBuilder.andWhere(
        `(pet.name ILIKE :query OR pet.bio ILIKE :query)`,
        { query: `%${query}%` },
      );
    }

    // Species filter
    if (filters.species) {
      queryBuilder.andWhere('pet.species = :species', { species: filters.species });
    }

    // Country filter
    if (filters.country) {
      queryBuilder.andWhere('pet.locationCountry = :country', { country: filters.country });
    }

    // Order by relevance (followers count as proxy)
    queryBuilder.orderBy('pet.followersCount', 'DESC');

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip(pagination.skip)
      .take(pagination.limit)
      .getMany();

    return {
      items,
      total,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    };
  }

  // Suggested pets to follow
  async getSuggestions(userId: string, limit: number = 10): Promise<Pet[]> {
    // Get user's pets
    const userPets = await this.petRepository.find({
      where: { ownerId: userId },
      select: ['id'],
    });

    const userPetIds = userPets.map((p) => p.id);

    if (userPetIds.length === 0) {
      // User has no pets, return popular pets
      return this.petRepository.find({
        where: { isActive: true },
        order: { followersCount: 'DESC' },
        take: limit,
      });
    }

    // Get pets that user's pets are following
    const followingIds = await this.followRepository
      .createQueryBuilder('follow')
      .select('follow.followingId')
      .where('follow.followerId IN (:...userPetIds)', { userPetIds })
      .getMany()
      .then((follows) => follows.map((f) => f.followingId));

    // Exclude already following and own pets
    const excludeIds = [...userPetIds, ...followingIds];

    // Get popular pets not in excluded list
    const queryBuilder = this.petRepository
      .createQueryBuilder('pet')
      .where('pet.isActive = :isActive', { isActive: true })
      .andWhere('pet.deletedAt IS NULL');

    if (excludeIds.length > 0) {
      queryBuilder.andWhere('pet.id NOT IN (:...excludeIds)', { excludeIds });
    }

    return queryBuilder
      .orderBy('pet.followersCount', 'DESC')
      .take(limit)
      .getMany();
  }
}
