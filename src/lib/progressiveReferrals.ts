export interface ProgressiveReferralBonus {
  id: string;
  name: string;
  description: string;
  trigger: 'signup' | 'first_scan' | 'first_craft' | 'first_stabilize' | 'earn_100_rzn' | 'time_24h';
  reward: {
    rzn?: number;
    energy?: number;
    items?: { item: string; qty: number }[];
  };
  unlocked?: boolean;
  unlockedAt?: Date;
}

export const PROGRESSIVE_REFERRAL_BONUSES: Record<string, ProgressiveReferralBonus> = {
  WELCOME_BONUS: {
    id: 'WELCOME_BONUS',
    name: 'Welcome Scanner',
    description: 'Complete your first neural scan',
    trigger: 'first_scan',
    reward: { rzn: 150 }
  },
  CRAFTER_BONUS: {
    id: 'CRAFTER_BONUS',
    name: 'Neural Apprentice',
    description: 'Craft your first item',
    trigger: 'first_craft',
    reward: { rzn: 100 }
  },
  STABILIZER_BONUS: {
    id: 'STABILIZER_BONUS',
    name: 'Anomaly Resolver',
    description: 'Stabilize your first anomaly',
    trigger: 'first_stabilize',
    reward: { rzn: 125 }
  },
  EARNER_BONUS: {
    id: 'EARNER_BONUS',
    name: 'RZN Collector',
    description: 'Earn your first 100 RZN through gameplay',
    trigger: 'earn_100_rzn',
    reward: { rzn: 75, items: [{ item: 'shard_common', qty: 3 }] }
  },
  LOYALTY_BONUS: {
    id: 'LOYALTY_BONUS',
    name: 'Loyal Recruit',
    description: 'Stay active for 24 hours after joining',
    trigger: 'time_24h',
    reward: { rzn: 200 }
  }
};

export interface UserProgressiveStatus {
  walletAddress: string;
  referredBy?: string;
  joinedAt: Date;
  bonusesUnlocked: string[];
  totalBonusRzn: number;
  lastActivityAt: Date;
}

export class ProgressiveReferralService {

  /**
   * Check which bonuses a user has unlocked based on their activity
   */
  static async checkProgressiveBonuses(
    walletAddress: string,
    userStats: {
      totalScans: number;
      totalCrafts: number;
      totalStabilizes: number;
      totalRznEarned: number;
      joinedAt: Date;
      lastLogin: Date;
    },
    currentBonuses: string[]
  ): Promise<string[]> {
    const newlyUnlocked: string[] = [];
    const now = new Date();
    const joinedAt = new Date(userStats.joinedAt);
    const hoursActive = (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60);

    Object.values(PROGRESSIVE_REFERRAL_BONUSES).forEach(bonus => {
      // Skip if already unlocked
      if (currentBonuses.includes(bonus.id)) return;

      let shouldUnlock = false;

      switch (bonus.trigger) {
        case 'first_scan':
          shouldUnlock = userStats.totalScans >= 1;
          break;
        case 'first_craft':
          shouldUnlock = userStats.totalCrafts >= 1;
          break;
        case 'first_stabilize':
          shouldUnlock = userStats.totalStabilizes >= 1;
          break;
        case 'earn_100_rzn':
          shouldUnlock = userStats.totalRznEarned >= 100;
          break;
        case 'time_24h':
          shouldUnlock = hoursActive >= 24;
          break;
      }

      if (shouldUnlock) {
        newlyUnlocked.push(bonus.id);
      }
    });

    return newlyUnlocked;
  }

  /**
   * Calculate total potential bonus for a new referred user
   */
  static getTotalPotentialBonus(): { rzn: number; energy: number; items: { item: string; qty: number }[] } {
    let totalRzn = 0;
    let totalEnergy = 0;
    const allItems: { item: string; qty: number }[] = [];

    Object.values(PROGRESSIVE_REFERRAL_BONUSES).forEach(bonus => {
      totalRzn += bonus.reward.rzn || 0;
      totalEnergy += bonus.reward.energy || 0;
      if (bonus.reward.items) {
        allItems.push(...bonus.reward.items);
      }
    });

    return {
      rzn: totalRzn, // 575 RZN total (energy rewards removed)
      energy: totalEnergy, // 0 Energy (removed for simplicity)
      items: allItems
    };
  }

  /**
   * Get user-friendly description of next bonus to unlock
   */
  static getNextBonusToUnlock(currentBonuses: string[]): ProgressiveReferralBonus | null {
    const unlockedSet = new Set(currentBonuses);

    // Return first bonus not yet unlocked, prioritized by easiest to achieve
    const priorityOrder = ['WELCOME_BONUS', 'CRAFTER_BONUS', 'STABILIZER_BONUS', 'EARNER_BONUS', 'LOYALTY_BONUS'];

    for (const bonusId of priorityOrder) {
      if (!unlockedSet.has(bonusId)) {
        return PROGRESSIVE_REFERRAL_BONUSES[bonusId];
      }
    }

    return null; // All bonuses unlocked
  }

  /**
   * Generate anti-cheat metadata for new referral
   */
  static generateAntiCheatMetadata(req?: Request): {
    userAgent?: string;
    ipHash?: string;
    timestamp: string;
    deviceFingerprint?: string;
  } {
    return {
      userAgent: req?.headers.get('user-agent') || undefined,
      // Note: IP hashing should be done server-side for security
      timestamp: new Date().toISOString(),
      // Device fingerprinting would be implemented client-side
    };
  }
}