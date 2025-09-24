export type AchievementType =
  | 'FIRST_SCAN'
  | 'FIRST_CRAFT'
  | 'FIRST_STABILIZE'
  | 'SCANS_10'
  | 'SCANS_50'
  | 'SCANS_100'
  | 'SCANS_500'
  | 'CRAFTS_10'
  | 'CRAFTS_50'
  | 'CRAFTS_100'
  | 'STABILIZES_10'
  | 'STABILIZES_50'
  | 'STABILIZES_100'
  | 'RZN_1000'
  | 'RZN_5000'
  | 'RZN_10000'
  | 'ENERGY_MASTER'
  | 'DAILY_STREAK_7'
  | 'DAILY_STREAK_30'
  | 'REFERRAL_FIRST'
  | 'REFERRAL_10'
  | 'SOCIAL_SHARER'
  | 'DAILY_SHARE_X';

export type AchievementRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type Achievement = {
  id: AchievementType;
  name: string;
  description: string;
  rarity: AchievementRarity;
  icon: string; // Lucide icon name
  requirement: {
    type: 'scans' | 'crafts' | 'stabilizes' | 'rzn' | 'referrals' | 'streak' | 'energy' | 'social' | 'daily_share';
    target: number;
  };
  reward: {
    rzn?: number;
    energy?: number;
    items?: { item: string; qty: number }[];
  };
  unlocked?: boolean;
  unlockedAt?: Date;
};

export type UserAchievements = {
  unlocked: AchievementType[];
  progress: Record<AchievementType, number>;
  lastChecked: Date;
};

export type UserStats = {
  totalScans: number;
  totalCrafts: number;
  totalStabilizes: number;
  totalRznEarned: number;
  currentStreak: number;
  longestStreak: number;
  referralsMade: number;
  socialShares: number;
  lastLogin: Date;
  energySpent: number;
  dailySharesCompleted: number;
  lastDailyShare: Date | null;
};