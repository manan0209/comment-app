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
      // Hate speech and slurs - with variations (removed very short words)
      'nigger', 'nigga', 'n1gger', 'n1gga', 'negro', 'negr0',
      'fuck', 'fck', 'fuk', 'f*ck', 'f**k', 'fucker', 'fcker', 'fukr', 'f*cker',
      'shit', 'sht', 'sh1t', 'shyt', 'shiit', 'shitt',
      'bitch', 'btch', 'b1tch', 'biatch', 'beetch', 'bytch',
      'whore', 'wh0re', 'hore', 'who-re', 'w.h.o.r.e',
      'slut', 'sl*t', 'sloot', 'sluut', 's1ut',
      'cunt', 'cnt', 'c*nt', 'c**t', 'cnut',
      'dick', 'dck', 'd1ck', 'dich',
      'cock', 'cok', 'c0ck', 'cck', 'coock',
      'pussy', 'psy', 'p*ssy', 'puss', 'pussi',
      'asshole', 'a$$hole', 'ashole', 'azhole',
      'damn', 'dayum', 'daam',
      
      // Violence and threats
      'kill', 'kil', 'k1ll', 'kyll', 'murder', 'mrder', 'murd3r',
      'death', 'deth', 'deeth',
      'suicide', 'suicid', 'suic1de', 'kill yourself', 'kys',
      'rape', 'r4pe', 'rap3', 'raape', 'r@pe',
      'violence', 'violent', 'v1olence', 'violenc',
      'terrorist', 'terror', 'terr0r', 'terrorism',
      'bomb', 'b0mb', 'bo-mb', 'boom', 'explode',
      'weapon', 'weap0n', 'guns', 'shooting',
      
      // Drugs
      'drugs', 'dr*g', 'dr*gs', 'drugg',
      'cocaine', 'coke', 'c0caine', 'cocain', 'crack',
      'heroin', 'hero1n', 'heroine', 'smack',
      'marijuana', 'weed', 'w33d', 'ganja',
      'meth', 'crystal', 'speed', 'amphetamine',
      
      // Hate groups
      'nazi', 'n4zi', 'naz1', 'hitler', 'h1tler',
      'genocide', 'gen0cide', 'ethnic cleansing',
      'kkk', 'ku klux', 'white power', 'white supremacy',
      
      // Spam related
      'spam', 'sp4m', 'spaam', 'scam', 'sc4m', 'fraud', 'fr4ud',
      'phishing', 'ph1shing', 'fake', 'f4ke'
    ],
    medium: [
      // Insults and offensive language
      'stupid', 'stup1d', 'stoopid', 'stuupid', 'st*pid',
      'idiot', '1diot', 'idi0t', 'idyot', 'id10t',
      'moron', 'm0ron', 'mor0n', 'moronix', 'moronic',
      'dumb', 'dumb4ss', 'dumba$$', 'dumbo',
      'retard', 'ret4rd', 'retarded', 'r3tard', 'tard',
      'loser', 'l0ser', 'looser', 'lozr', 'luser',
      'ugly', 'ugl1', 'uglee', 'uggly', 'fugly',
      'obese', '0bese', 'fatass', 'fatso',
      'worthless', 'w0rthless', 'useless', 'us3less',
      'pathetic', 'path3tic', 'pathethic', 'lame',
      'disgusting', 'disgust1ng', 'gross', 'gr0ss',
      'freak', 'fr34k', 'weirdo', 'we1rdo', 'creep',
      'trash', 'tr4sh', 'garbage', 'garb4ge'
    ],
    low: [
      // Mild profanity
      'crap', 'cr4p', 'crapp', 'crep',
      'suck', 'sucks', 'suckz',
      'piss', 'p1ss', 'pissed', 'pist',
      'hell', 'h3ll',
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
    /(.)\1{6,}/g, // Repeated characters (aaaaaaa) - increased threshold
    /\b\d{12,}\b/g, // Long numbers (very long phone numbers) - increased threshold
    /\b[A-Z]{8,}\b/g, // EXCESSIVE CAPS - increased threshold
    /(https?:\/\/[^\s]+)/g, // URLs
    /\b(www\.|\.com|\.org|\.net|\.info|\.biz)\b/gi, // Domain patterns
    /\b(buy now|sell now|cheap|free download|click here|visit now|earn money|cash prize|winner|congratulations you|urgent|limited time)\b/gi, // More specific spam words
    /\b(viagra|cialis|pharmacy|pills|medication|prescription|enhancement)\b/gi, // Pharmaceutical spam
    /\b(lottery winner|casino bonus|gambling|poker|slots|bet now)\b/gi, // Gambling spam
    /\b(work from home|make money fast|get rich quick|investment opportunity|cryptocurrency|bitcoin mining)\b/gi, // Financial spam
    /\b(dating site|hookup|singles|meet now|chat now|cam|webcam)\b/gi, // Dating spam
    /[^\w\s]{5,}/g, // Excessive special characters - increased threshold
    /\b(\w)\1{4,}\b/g, // Repeated letters in words (helloooo) - increased threshold
    /\b[0-9]{4,}\b.*\b[0-9]{4,}\b/g, // Multiple number groups - increased threshold
    /([.!?])\1{4,}/g, // Repeated punctuation - increased threshold
    /\b(like and subscribe|follow and share|comment below|upvote this|downvote)\b.*\b(for free|to win|and get|bonus|prize)\b/gi, // Social media spam
  ];

  // Apply character substitutions to normalize text
  private applyCharacterSubstitutions(text: string): string {
    let normalized = text.toLowerCase();
    
    // Only apply substitutions in specific contexts to avoid false positives
    // Be more conservative with substitutions
    
    // Handle obvious leetspeak patterns
    normalized = normalized.replace(/sh1t/g, 'shit');
    normalized = normalized.replace(/f\*ck/g, 'fuck');
    normalized = normalized.replace(/f\*\*k/g, 'fuck');
    normalized = normalized.replace(/b1tch/g, 'bitch');
    normalized = normalized.replace(/a\$\$/g, 'ass');
    normalized = normalized.replace(/a\$\$h0le/g, 'asshole');
    normalized = normalized.replace(/wh0re/g, 'whore');
    normalized = normalized.replace(/sl\*t/g, 'slut');
    normalized = normalized.replace(/c\*nt/g, 'cunt');
    normalized = normalized.replace(/d1ck/g, 'dick');
    normalized = normalized.replace(/c0ck/g, 'cock');
    normalized = normalized.replace(/n1gg/g, 'nigg');
    normalized = normalized.replace(/r4pe/g, 'rape');
    normalized = normalized.replace(/k1ll/g, 'kill');
    normalized = normalized.replace(/murd3r/g, 'murder');
    normalized = normalized.replace(/b0mb/g, 'bomb');
    normalized = normalized.replace(/dr\*g/g, 'drug');
    normalized = normalized.replace(/n4zi/g, 'nazi');
    normalized = normalized.replace(/h1tler/g, 'hitler');
    normalized = normalized.replace(/stup1d/g, 'stupid');
    normalized = normalized.replace(/1diot/g, 'idiot');
    normalized = normalized.replace(/ret4rd/g, 'retard');
    normalized = normalized.replace(/l0ser/g, 'loser');
    normalized = normalized.replace(/p1ss/g, 'piss');
    normalized = normalized.replace(/cr4p/g, 'crap');
    normalized = normalized.replace(/h3ll/g, 'hell');
    
    // Handle common separators used to bypass filters, but be more careful
    normalized = normalized.replace(/([a-z])[._\-+*#@!$%^&(){}[\]|\\:;"'<>?/~`]+([a-z])/g, '$1$2');
    
    // Remove excessive whitespace
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Handle specific leetspeak patterns that are commonly used
    normalized = normalized.replace(/\bh8\b/g, 'hate');
    normalized = normalized.replace(/\bkys\b/g, 'kill yourself');
    normalized = normalized.replace(/\bwtf\b/g, 'what the fuck');
    normalized = normalized.replace(/\bstfu\b/g, 'shut the fuck up');
    normalized = normalized.replace(/\bfml\b/g, 'fuck my life');
    normalized = normalized.replace(/\bomg\b/g, 'oh my god');
    normalized = normalized.replace(/\bffs\b/g, 'for fucks sake');
    
    return normalized.trim();
  }

  // Check for word variations and similar words
  private checkWordVariations(content: string, bannedWords: string[]): string[] {
    const flaggedWords: string[] = [];
    const normalizedContent = this.applyCharacterSubstitutions(content);
    
    for (const word of bannedWords) {
      const normalizedWord = this.applyCharacterSubstitutions(word);
      
      // Only check words that are at least 3 characters long to avoid false positives
      if (normalizedWord.length < 3) continue;
      
      // Check for whole word matches only using word boundaries
      const wordBoundaryRegex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (wordBoundaryRegex.test(normalizedContent)) {
        flaggedWords.push(word);
        continue;
      }
      
      // Check for spaced out words (f u c k) - only for longer words
      if (normalizedWord.length >= 4) {
        const spacedWord = normalizedWord.split('').join('\\s*');
        const spacedRegex = new RegExp(`\\b${spacedWord}\\b`, 'gi');
        if (spacedRegex.test(normalizedContent)) {
          flaggedWords.push(word);
          continue;
        }
      }
      
      // Check for words with extra characters (fuuuuck) - only for longer words
      if (normalizedWord.length >= 4) {
        const stretchedPattern = normalizedWord.split('').map(char => `${char}+`).join('');
        const stretchedRegex = new RegExp(`\\b${stretchedPattern}\\b`, 'gi');
        if (stretchedRegex.test(normalizedContent)) {
          flaggedWords.push(word);
          continue;
        }
      }
      
      // Only use fuzzy matching for longer words and with stricter criteria
      if (normalizedWord.length >= 5) {
        const words = normalizedContent.split(/\s+/);
        for (const contentWord of words) {
          if (contentWord.length >= 4 && 
              this.calculateLevenshteinDistance(contentWord, normalizedWord) <= 1 && 
              Math.abs(contentWord.length - normalizedWord.length) <= 2) {
            flaggedWords.push(word);
            break;
          }
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
    if (spamScore > 0.9) { // Increased threshold to be less aggressive
      flaggedWords.push('spam-pattern');
      severity = 'high';
    }

    // Check user history
    const userRisk = await this.getUserRiskLevel(userId);
    
    // Determine action based on severity and user history
    if (flaggedWords.length > 0 || spamScore > 0.9) { // Updated threshold
      if (severity === 'high' || userRisk === 'high') {
        action = flaggedWords.length > 3 ? 'ban' : 'block'; // Increased threshold
      } else if (severity === 'medium' || userRisk === 'medium') {
        action = 'warn';
      }
    }

    // Build reason string
    let reason: string | undefined;
    if (flaggedWords.length > 0) {
      reason = `Flagged words: ${flaggedWords.join(', ')}`;
    } else if (spamScore > 0.9) { // Updated threshold
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

    // Check spam patterns - be more conservative
    for (const pattern of this.SPAM_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length * 0.1; // Further reduced from 0.15
      }
    }

    // Check for excessive repetition - be more lenient
    const words = content.split(' ');
    const uniqueWords = new Set(words);
    if (words.length > 5) { // Only check if there are more than 5 words
      const repetitionRatio = 1 - (uniqueWords.size / words.length);
      if (repetitionRatio > 0.6) { // Only penalize if more than 60% repetition
        score += repetitionRatio * 0.15; // Further reduced from 0.2
      }
    }

    // Check for excessive length - be more lenient
    if (length > 3000) score += 0.1; // Increased threshold
    if (length > 6000) score += 0.2; // Increased threshold

    // Check for excessive caps - be more lenient
    if (length > 10) { // Only check if content has more than 10 characters
      const capsRatio = (content.match(/[A-Z]/g) || []).length / length;
      if (capsRatio > 0.7) score += 0.15; // Increased threshold and reduced penalty
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
