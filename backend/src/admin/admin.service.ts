import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { ModerationService } from '../moderation/moderation.service';
import { AdminAction, AdminCommentActionDto, BulkAdminActionDto } from './dto/admin-comment-action.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private moderationService: ModerationService,
  ) {}

  async getAllComments(page = 1, limit = 50, searchTerm?: string) {
    const skip = (page - 1) * limit;
    
    let query = this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.parent', 'parent')
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (searchTerm) {
      query = query.where('comment.content ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      });
    }

    const [comments, total] = await query.getManyAndCount();
    
    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReportedComments() {
    const suspiciousWords = ['spam', 'abuse', 'hate', 'offensive'];
    
    return this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where(suspiciousWords.map(word => `comment.content ILIKE '%${word}%'`).join(' OR '))
      .orderBy('comment.createdAt', 'DESC')
      .getMany();
  }

  async performCommentAction(commentId: string, actionDto: AdminCommentActionDto) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    switch (actionDto.action) {
      case AdminAction.SOFT_DELETE:
        comment.isDeleted = true;
        comment.deletedAt = new Date();
        comment.content = '[Content removed by admin]';
        break;

      case AdminAction.HARD_DELETE:
        // Remove related notifications first
        await this.notificationsRepository.delete({ commentId });
        await this.commentsRepository.delete(commentId);
        return { success: true, message: 'Comment permanently deleted' };

      case AdminAction.RESTORE:
        comment.isDeleted = false;
        comment.deletedAt = null;
        break;

      case AdminAction.UPDATE_CONTENT:
        if (actionDto.newContent) {
          comment.content = actionDto.newContent;
          comment.isEdited = true;
        }
        break;
    }

    await this.commentsRepository.save(comment);
    return { success: true, comment };
  }

  async performBulkAction(bulkActionDto: BulkAdminActionDto) {
    const { commentIds, action } = bulkActionDto;
    const results = [];

    for (const commentId of commentIds) {
      try {
        const result = await this.performCommentAction(commentId, {
          action,
          reason: bulkActionDto.reason,
        });
        results.push({ commentId, success: true, result });
      } catch (error) {
        results.push({ commentId, success: false, error: error.message || 'Unknown error' });
      }
    }

    return results;
  }

  async getUserStats() {
    const totalUsers = await this.usersRepository.count();
    const totalComments = await this.commentsRepository.count();
    const deletedComments = await this.commentsRepository.count({
      where: { isDeleted: true },
    });

    // Get moderation stats
    const moderationStats = await this.moderationService.getModerationStats();

    return {
      totalUsers,
      totalComments,
      deletedComments,
      activeComments: totalComments - deletedComments,
      ...moderationStats,
    };
  }

  async runAutoModeration() {
    return this.moderationService.autoModerateExistingContent();
  }

  async searchCommentsByContent(searchTerm: string) {
    return this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.content ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      })
      .orderBy('comment.createdAt', 'DESC')
      .getMany();
  }

  // Add admin role check - using environment variable for security
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    // Get admin emails from environment variable
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    
    return user && adminEmails.includes(user.email);
  }
}
