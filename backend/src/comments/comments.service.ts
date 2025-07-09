import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: string): Promise<Comment> {
    await this.usersService.findByIdOrThrow(authorId);

    let parent: Comment | null = null;
    if (createCommentDto.parentId) {
      parent = await this.commentsRepository.findOne({
        where: { id: createCommentDto.parentId, isDeleted: false },
        relations: ['author'],
      });

      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      authorId,
      parentId: createCommentDto.parentId || null,
    });

    const savedComment = await this.commentsRepository.save(comment);

    if (parent && parent.authorId !== authorId) {
      await this.notificationsService.createReplyNotification(
        parent.authorId,
        savedComment.id,
        authorId,
      );
    }

    return this.findById(savedComment.id);
  }

  async findAll(page = 1, limit = 20): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    
    const [comments, total] = await this.commentsRepository.findAndCount({
      where: { parentId: IsNull() },
      relations: ['author', 'replies', 'replies.author'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const commentsWithNestedReplies = await Promise.all(
      comments.map(comment => this.loadNestedReplies(comment))
    );

    const transformedComments = commentsWithNestedReplies.map(comment => this.transformComment(comment));

    return {
      comments: transformedComments,
      total,
      hasMore: skip + limit < total,
    };
  }

  private async loadNestedReplies(comment: Comment): Promise<Comment> {
    if (comment.replies && comment.replies.length > 0) {
      const repliesWithNested = await Promise.all(
        comment.replies
          .map(async (reply) => {
            const fullReply = await this.commentsRepository.findOne({
              where: { id: reply.id },
              relations: ['author', 'replies', 'replies.author'],
            });
            return this.loadNestedReplies(fullReply);
          })
      );
      comment.replies = repliesWithNested;
    }
    return comment;
  }

  async findById(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author', 'parent', 'replies'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.transformComment(comment);
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<Comment> {
    const comment = await this.findById(id);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('Cannot edit deleted comment');
    }

    if (!comment.canEdit) {
      throw new BadRequestException('Comment can only be edited within 15 minutes of posting');
    }

    if (!comment.originalContent) {
      comment.originalContent = comment.content;
    }

    comment.content = updateCommentDto.content;
    comment.isEdited = true;

    await this.commentsRepository.save(comment);
    return this.findById(comment.id);
  }

  async delete(id: string, userId: string): Promise<Comment> {
    const comment = await this.findById(id);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('Comment is already deleted');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();

    await this.commentsRepository.save(comment);
    return this.findById(comment.id);
  }

  async restore(id: string, userId: string): Promise<Comment> {
    const comment = await this.findById(id);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only restore your own comments');
    }

    if (!comment.isDeleted) {
      throw new BadRequestException('Comment is not deleted');
    }

    if (!comment.canRestore) {
      throw new BadRequestException('Comment can only be restored within 15 minutes of deletion');
    }

    comment.isDeleted = false;
    comment.deletedAt = null;

    await this.commentsRepository.save(comment);
    return this.findById(comment.id);
  }

  private transformComment(comment: Comment): any {
    // Calculate permission properties
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const canEdit = comment.createdAt > fifteenMinutesAgo && !comment.isDeleted;
    const canRestore = comment.isDeleted && comment.deletedAt && comment.deletedAt > fifteenMinutesAgo;
    
    return {
      ...comment,
      canEdit,
      canRestore,
      replies: comment.replies ? comment.replies.map(reply => this.transformComment(reply)) : [],
    };
  }
}
