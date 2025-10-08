import { Injectable } from '@nestjs/common';

export interface PasswordStrength {
  score: number;
  feedback: string[];
  isStrong: boolean;
}

@Injectable()
export class PasswordStrengthService {
  /**
   * Calculate password strength score (0-100)
   */
  calculateStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 20;
    } else {
      score += 10;
    }

    // Character variety checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[@$!%*?&]/.test(password);

    if (hasLowercase) score += 15;
    else feedback.push('Add lowercase letters');

    if (hasUppercase) score += 15;
    else feedback.push('Add uppercase letters');

    if (hasNumbers) score += 15;
    else feedback.push('Add numbers');

    if (hasSpecialChars) score += 15;
    else feedback.push('Add special characters (@$!%*?&)');

    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /user/i,
    ];

    const hasCommonPattern = commonPatterns.some((pattern) =>
      pattern.test(password),
    );
    if (hasCommonPattern) {
      score -= 20;
      feedback.push('Avoid common patterns');
    }

    // Sequential characters check
    const hasSequential = this.hasSequentialChars(password);
    if (hasSequential) {
      score -= 10;
      feedback.push('Avoid sequential characters');
    }

    // Repeated characters check
    const hasRepeated = this.hasRepeatedChars(password);
    if (hasRepeated) {
      score -= 5;
      feedback.push('Avoid repeated characters');
    }

    // Bonus for length
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 5;

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      feedback: feedback.length > 0 ? feedback : ['Password is strong!'],
      isStrong: score >= 70,
    };
  }

  /**
   * Check if password contains sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
    ];

    for (const sequence of sequences) {
      for (let i = 0; i < sequence.length - 2; i++) {
        const subseq = sequence.substring(i, i + 3);
        if (password.toLowerCase().includes(subseq)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if password has repeated characters
   */
  private hasRepeatedChars(password: string): boolean {
    for (let i = 0; i < password.length - 2; i++) {
      if (
        password[i] === password[i + 1] &&
        password[i + 1] === password[i + 2]
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate password against common weak passwords
   */
  validateAgainstWeakPasswords(password: string): boolean {
    const weakPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'user',
      'test',
      'guest',
    ];

    return !weakPasswords.includes(password.toLowerCase());
  }

  /**
   * Get password strength level
   */
  getStrengthLevel(score: number): string {
    if (score < 30) return 'Very Weak';
    if (score < 50) return 'Weak';
    if (score < 70) return 'Medium';
    if (score < 90) return 'Strong';
    return 'Very Strong';
  }
}
