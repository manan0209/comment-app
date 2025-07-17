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
      // Hate speech and slurs - with variations
      'nigger', 'nigga', 'n1gger', 'n1gga', 'nig', 'negro', 'negr0',
      'fuck', 'fck', 'fuk', 'f*ck', 'f**k', 'fucker', 'fcker', 'fukr', 'f*cker',
      'shit', 'sht', 'sh1t', 'shyt', 'shiit', 'shitt',
      'bitch', 'btch', 'b1tch', 'biatch', 'beetch', 'bytch',
      'whore', 'wh0re', 'hore', 'who-re', 'w.h.o.r.e',
      'slut', 'sl*t', 'sloot', 'sluut', 's1ut',
      'cunt', 'cnt', 'c*nt', 'c**t', 'cnut',
      'dick', 'dck', 'd1ck', 'dik', 'dich', 'dic',
      'cock', 'cok', 'c0ck', 'cck', 'coock',
      'pussy', 'psy', 'p*ssy', 'puss', 'pussi',
      'ass', 'azz', 'a$$', 'a55', 'arse', 'asshole', 'a$$hole',
      'damn', 'dam', 'dayum', 'daam', 'dmn',
      
      // Violence and threats
      'kill', 'kil', 'k1ll', 'kyll', 'murder', 'mrder', 'murd3r',
      'death', 'deth', 'deeth', 'die', 'dye', 'd1e',
      'suicide', 'suicid', 'suic1de', 'kill yourself', 'kys',
      'rape', 'r4pe', 'rap3', 'raape', 'r@pe',
      'violence', 'violent', 'v1olence', 'violenc',
      'terrorist', 'terror', 'terr0r', 'terrorism',
      'bomb', 'b0mb', 'bo-mb', 'boom', 'explode',
      'weapon', 'weap0n', 'gun', 'gn', 'guns',
      'shoot', 'sh00t', 'shot', 'shooting',
      
      // Drugs
      'drug', 'drugs', 'dr*g', 'dr*gs', 'drugg',
      'cocaine', 'coke', 'c0caine', 'cocain', 'crack',
      'heroin', 'hero1n', 'heroine', 'smack',
      'marijuana', 'weed', 'w33d', 'pot', 'ganja',
      'meth', 'crystal', 'speed', 'amphetamine',
      
      // Hate groups
      'nazi', 'n4zi', 'naz1', 'hitler', 'h1tler',
      'genocide', 'gen0cide', 'ethnic cleansing',
      'kkk', 'ku klux', 'white power', 'white supremacy',
      
      // Spam related
      'spam', 'sp4m', 'spaam', 'scam', 'sc4m', 'fraud', 'fr4ud',
      'phishing', 'ph1shing', 'fake', 'f4ke', 'bot', 'b0t'
    ],
    medium: [
      // Insults and offensive language
      'stupid', 'stup1d', 'stoopid', 'stuupid', 'st*pid',
      'idiot', '1diot', 'idi0t', 'idyot', 'id10t',
      'moron', 'm0ron', 'mor0n', 'moronix', 'moronic',
      'dumb', 'dum', 'dumb4ss', 'dumba$$', 'dumbo',
      'retard', 'ret4rd', 'retarded', 'r3tard', 'tard',
      'loser', 'l0ser', 'looser', 'lozr', 'luser',
      'ugly', 'ugl1', 'uglee', 'uggly', 'fugly',
      'fat', 'f4t', 'obese', '0bese', 'fatass', 'fatso',
      'worthless', 'w0rthless', 'useless', 'us3less',
      'pathetic', 'path3tic', 'pathethic', 'lame',
      'disgusting', 'disgust1ng', 'gross', 'gr0ss',
      'freak', 'fr34k', 'weirdo', 'we1rdo', 'creep',
      'trash', 'tr4sh', 'garbage', 'garb4ge'
    ],
    low: [
      // Mild profanity
      'crap', 'cr4p', 'crapp', 'crep',
      'suck', 'sucks', 'sux', 'sukz', 'suckz',
      'piss', 'p1ss', 'pissed', 'pist',
      'hell', 'hel', 'h3ll', 'heel',
      'annoying', 'ann0ying', 'irritating',
      'boring', 'b0ring', 'bor1ng', 'booring',
      'lame', 'l4me', 'lamee', 'lamer'
    ]
  };

  // Common character substitutions used to bypass filters
  private readonly CHAR_SUBSTITUTIONS = {
    'a': ['@', '4', 'á', 'à', 'â', 'ä', 'å'],
    'e': ['3', 'é', 'è', 'ê', 'ë'],
    'i': ['1', '!', 'í', 'ì', 'î', 'ï'],
    'o': ['0', 'ó', 'ò', 'ô', 'ö', 'ø'],
    'u': ['ú', 'ù', 'û', 'ü'],
    's': ['5', '$', 'ś', 'š'],
    'l': ['1', '!', 'ł'],
    'c': ['©', '¢'],
    'g': ['9', '6'],
    'z': ['2']
  };

  private readonly SPAM_PATTERNS = [
    /(.)\1{4,}/g, // Repeated characters (aaaaa)
    /\b\d{10,}\b/g, // Long numbers (phone numbers)
    /\b[A-Z]{5,}\b/g, // EXCESSIVE CAPS
    /(https?:\/\/[^\s]+)/g, // URLs
    /\b(www\.|\.com|\.org|\.net|\.info|\.biz)\b/gi, // Domain patterns
    /\b(buy|sell|cheap|free|click|visit|download|earn|money|cash|prize|winner|congratulations)\b/gi, // Spam words
    /\b(viagra|cialis|pharmacy|pills|medication|prescription)\b/gi, // Pharmaceutical spam
    /\b(lottery|casino|gambling|poker|slots|bet)\b/gi, // Gambling spam
    /\b(work from home|make money|get rich|investment|cryptocurrency|bitcoin)\b/gi, // Financial spam
    /\b(dating|hookup|singles|meet|chat|cam|webcam)\b/gi, // Dating spam
    /[^\w\s]{3,}/g, // Excessive special characters
    /\b(\w)\1{2,}\b/g, // Repeated letters in words (hellooo)
    /\b[0-9]{3,}\b.*\b[0-9]{3,}\b/g, // Multiple number groups
    /([.!?])\1{2,}/g, // Repeated punctuation
    /\b(like|subscribe|follow|share|comment|upvote|downvote)\b.*\b(for|to|and|get|win|free)\b/gi, // Social media spam
  ];

  // Apply character substitutions to normalize text
  private applyCharacterSubstitutions(text: string): string {
    let normalized = text.toLowerCase();
    
    // Apply character substitutions
    for (const [original, substitutes] of Object.entries(this.CHAR_SUBSTITUTIONS)) {
      for (const substitute of substitutes) {
        const regex = new RegExp(substitute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        normalized = normalized.replace(regex, original);
      }
    }
    
    // Remove common separators used to bypass filters
    normalized = normalized.replace(/[._\-+*#@!$%^&(){}[\]|\\:;"'<>?/~`]/g, '');
    
    // Remove excessive whitespace
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Handle additional leetspeak patterns
    normalized = normalized.replace(/h8/g, 'hate');
    normalized = normalized.replace(/gr8/g, 'great');
    normalized = normalized.replace(/w8/g, 'wait');
    normalized = normalized.replace(/m8/g, 'mate');
    normalized = normalized.replace(/u/g, 'you');
    normalized = normalized.replace(/ur/g, 'your');
    normalized = normalized.replace(/b4/g, 'before');
    normalized = normalized.replace(/2/g, 'to');
    normalized = normalized.replace(/4/g, 'for');
    
    return normalized.trim();
  }

  // Check for word variations and similar words
  private checkWordVariations(content: string, bannedWords: string[]): string[] {
    const flaggedWords: string[] = [];
    const normalizedContent = this.applyCharacterSubstitutions(content);
    
    for (const word of bannedWords) {
      const normalizedWord = this.applyCharacterSubstitutions(word);
      
      // Check exact match
      if (normalizedContent.includes(normalizedWord)) {
        flaggedWords.push(word);
        continue;
      }
      
      // Check for spaced out words (f u c k)
      const spacedWord = normalizedWord.split('').join(' ');
      if (normalizedContent.includes(spacedWord)) {
        flaggedWords.push(word);
        continue;
      }
      
      // Check for words with extra characters (fuuuuck)
      const wordPattern = normalizedWord.split('').join('+');
      const regex = new RegExp(wordPattern, 'gi');
      if (regex.test(normalizedContent)) {
        flaggedWords.push(word);
        continue;
      }
      
      // Check for fuzzy matching (allowing 1-2 character differences)
      const words = normalizedContent.split(' ');
      for (const contentWord of words) {
        if (this.calculateLevenshteinDistance(contentWord, normalizedWord) <= 2 && 
            normalizedWord.length > 3) {
          flaggedWords.push(word);
          break;
        }
      }
    }
    
    return flaggedWords;
  }

  // Calculate Levenshtein distance for fuzzy matching
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Main moderation function
  async moderateContent(content: string, userId: string): Promise<ModerationResult> {
    const flaggedWords: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let action: 'allow' | 'warn' | 'block' | 'ban' = 'allow';

    // Check for banned words using advanced pattern matching
    for (const [level, words] of Object.entries(this.BANNED_WORDS)) {
      const foundWords = this.checkWordVariations(content, words);
      flaggedWords.push(...foundWords);
      
      if (foundWords.length > 0) {
        if (level === 'high') severity = 'high';
        else if (level === 'medium' && severity !== 'high') severity = 'medium';
      }
    }

    // Check for spam patterns
    const spamScore = this.calculateSpamScore(content);
    if (spamScore > 0.8) { // Increased threshold from 0.7
      flaggedWords.push('spam-pattern');
      severity = 'high';
    }

    // Check user history
    const userRisk = await this.getUserRiskLevel(userId);
    
    // Determine action based on severity and user history
    if (flaggedWords.length > 0 || spamScore > 0.8) { // Updated threshold
      if (severity === 'high' || userRisk === 'high') {
        action = flaggedWords.length > 2 ? 'ban' : 'block';
      } else if (severity === 'medium' || userRisk === 'medium') {
        action = 'warn';
      }
    }

    // Build reason string
    let reason: string | undefined;
    if (flaggedWords.length > 0) {
      reason = `Flagged words: ${flaggedWords.join(', ')}`;
    } else if (spamScore > 0.8) { // Updated threshold
      reason = 'Content detected as spam';
    }

    return {
      isAllowed: action === 'allow' || action === 'warn',
      reason,
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
        score += matches.length * 0.15; // Reduced from 0.2
      }
    }

    // Check for excessive repetition
    const words = content.split(' ');
    const uniqueWords = new Set(words);
    if (words.length > 1) { // Avoid division by zero
      const repetitionRatio = 1 - (uniqueWords.size / words.length);
      score += repetitionRatio * 0.2; // Reduced from 0.3
    }

    // Check for excessive length (be more lenient)
    if (length > 2000) score += 0.1;
    if (length > 5000) score += 0.2;

    // Check for excessive caps (be more lenient)
    if (length > 0) {
      const capsRatio = (content.match(/[A-Z]/g) || []).length / length;
      if (capsRatio > 0.5) score += 0.2; // Increased threshold from 0.3
    }

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

    // Replace banned words with asterisks using enhanced detection
    for (const words of Object.values(this.BANNED_WORDS)) {
      const foundWords = this.checkWordVariations(cleaned, words);
      for (const word of foundWords) {
        // Find the actual word in the content and replace it
        const normalizedContent = this.applyCharacterSubstitutions(cleaned);
        const normalizedWord = this.applyCharacterSubstitutions(word);
        
        // Replace various forms of the word
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleaned = cleaned.replace(regex, '*'.repeat(word.length));
        
        // Also replace spaced versions
        const spacedWord = word.split('').join(' ');
        const spacedRegex = new RegExp(spacedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleaned = cleaned.replace(spacedRegex, '*'.repeat(word.length));
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
