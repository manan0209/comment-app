import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
  flaggedWords: string[];
  action: 'allow' | 'warn' | 'block' | 'ban';
}

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Comprehensive word lists for different severity levels
  private readonly BANNED_WORDS = {
    high: [
      'spam', 'scam', 'fraud', 'hate', 'kill', 'death', 'violence',
      'terrorist', 'bomb', 'weapon', 'drug', 'cocaine', 'heroin', 'fucker', 'sucker', 'dick',
      'nazi', 'hitler', 'genocide', 'rape', 'murder', 'suicide', 'fuck' , 'nigga', 'nigger'
    ],
    medium: [
      'stupid', 'idiot', 'moron', 'dumb', 'retard', 'loser', 'ugly',
      'fat', 'worthless', 'pathetic', 'disgusting', 'gross'
    ],
    low: [
      'damn', 'crap', 'suck', 'sucks', 'annoying', 'boring', 'lame'
    ]
  };

  private readonly SPAM_PATTERNS = [
    /(.)\1{4,}/g, // Repeated characters (aaaaa)
    /\b\d{10,}\b/g, // Long numbers (phone numbers)
    /\b[A-Z]{5,}\b/g, // EXCESSIVE CAPS
    /(https?:\/\/[^\s]+)/g, // URLs
    /\b(buy|sell|cheap|free|click|visit|download)\b/gi, // Common spam words
    /\b(www\.|\.com|\.org|\.net)\b/gi, // Domain patterns
  ];

  // Main moderation function
  async moderateContent(content: string, userId: string): Promise<ModerationResult> {
    const lowercaseContent = content.toLowerCase();
    const flaggedWords: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let action: 'allow' | 'warn' | 'block' | 'ban' = 'allow';

    // Check for banned words
    for (const [level, words] of Object.entries(this.BANNED_WORDS)) {
      for (const word of words) {
        if (lowercaseContent.includes(word)) {
          flaggedWords.push(word);
          if (level === 'high') severity = 'high';
          else if (level === 'medium' && severity !== 'high') severity = 'medium';
        }
      }
    }

    // Check for spam patterns
    const spamScore = this.calculateSpamScore(content);
    if (spamScore > 0.7) {
      flaggedWords.push('spam-pattern');
      severity = 'high';
    }

    // Check user history
    const userRisk = await this.getUserRiskLevel(userId);
    
    // Determine action based on severity and user history
    if (severity === 'high' || userRisk === 'high') {
      action = flaggedWords.length > 2 ? 'ban' : 'block';
    } else if (severity === 'medium' || userRisk === 'medium') {
      action = 'warn';
    }

    return {
      isAllowed: action === 'allow' || action === 'warn',
      reason: flaggedWords.length > 0 ? `Flagged words: ${flaggedWords.join(', ')}` : undefined,
      severity,
      flaggedWords,
      action,
    };
  }

  // Calculate spam score based on patterns
  private calculateSpamScore(content: string): number {
    let score = 0;
    const length = content.length;

    // Check spam patterns
    for (const pattern of this.SPAM_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length * 0.2;
      }
    }

    // Check for excessive repetition
    const words = content.split(' ');
    const uniqueWords = new Set(words);
    const repetitionRatio = 1 - (uniqueWords.size / words.length);
    score += repetitionRatio * 0.3;

    // Check for excessive length
    if (length > 1000) score += 0.1;
    if (length > 2000) score += 0.2;

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / length;
    if (capsRatio > 0.3) score += 0.2;

    return Math.min(score, 1);
  }

  // Get user risk level based on history
  private async getUserRiskLevel(userId: string): Promise<'low' | 'medium' | 'high'> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return 'high';

    // Check user's comment history
    const totalComments = await this.commentsRepository.count({ where: { authorId: userId } });
    const deletedComments = await this.commentsRepository.count({ 
      where: { authorId: userId, isDeleted: true } 
    });

    const deletionRatio = totalComments > 0 ? deletedComments / totalComments : 0;

    // Check account age
    const accountAge = Date.now() - user.createdAt.getTime();
    const isNewAccount = accountAge < 24 * 60 * 60 * 1000; // Less than 24 hours

    if (deletionRatio > 0.5 || isNewAccount) return 'high';
    if (deletionRatio > 0.2) return 'medium';
    return 'low';
  }

  // Auto-moderate existing content
  async autoModerateExistingContent(): Promise<{ processed: number; flagged: number; removed: number }> {
    const comments = await this.commentsRepository.find({ 
      where: { isDeleted: false },
      relations: ['author']
    });

    let processed = 0;
    let flagged = 0;
    let removed = 0;

    for (const comment of comments) {
      const result = await this.moderateContent(comment.content, comment.authorId);
      processed++;

      if (result.action === 'block' || result.action === 'ban') {
        comment.isDeleted = true;
        comment.deletedAt = new Date();
        comment.content = '[Content removed by auto-moderation]';
        await this.commentsRepository.save(comment);
        removed++;
      } else if (!result.isAllowed) {
        flagged++;
      }
    }

    return { processed, flagged, removed };
  }

  // Get content statistics
  async getModerationStats(): Promise<{
    totalComments: number;
    flaggedComments: number;
    removedComments: number;
    autoRemovedComments: number;
  }> {
    const totalComments = await this.commentsRepository.count();
    const removedComments = await this.commentsRepository.count({ where: { isDeleted: true } });
    const autoRemovedComments = await this.commentsRepository.count({ 
      where: { content: '[Content removed by auto-moderation]' } 
    });

    return {
      totalComments,
      flaggedComments: 0, // You can implement flagging system
      removedComments,
      autoRemovedComments,
    };
  }

  // Clean content by removing/replacing problematic parts
  cleanContent(content: string): string {
    let cleaned = content;

    // Replace banned words with asterisks
    for (const words of Object.values(this.BANNED_WORDS)) {
      for (const word of words) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '*'.repeat(word.length));
      }
    }

    // Remove URLs
    cleaned = cleaned.replace(/(https?:\/\/[^\s]+)/g, '[URL removed]');

    // Limit excessive caps
    cleaned = cleaned.replace(/[A-Z]{3,}/g, (match) => 
      match.charAt(0) + match.slice(1).toLowerCase()
    );

    return cleaned;
  }
}
