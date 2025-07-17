import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import { ModerationService } from './moderation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, User])],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
