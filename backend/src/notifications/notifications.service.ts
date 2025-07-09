import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { UsersService } from '../users/users.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private usersService: UsersService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createReplyNotification(
    userId: string,
    commentId: string,
    triggeredByUserId: string,
  ): Promise<Notification> {
    const [user, triggeredByUser] = await Promise.all([
      this.usersService.findByIdOrThrow(userId),
      this.usersService.findByIdOrThrow(triggeredByUserId),
    ]);

    const notification = this.notificationsRepository.create({
      type: NotificationType.REPLY,
      message: `${triggeredByUser.username} replied to your comment`,
      userId,
      commentId,
      triggeredByUserId,
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    const fullNotification = await this.notificationsRepository.findOne({
      where: { id: savedNotification.id },
      relations: ['triggeredByUser', 'comment'],
    });

    this.notificationsGateway.sendNotificationToUser(userId, fullNotification);

    return fullNotification;
  }

  async findUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationsRepository.find({
        where: { userId },
        relations: ['triggeredByUser', 'comment', 'comment.author'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      }),
      this.notificationsRepository.count({ where: { userId } }),
      this.notificationsRepository.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }
}
