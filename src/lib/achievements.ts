import { Achievement, AchievementType, UserStats, UserAchievements } from '@/types/achievements';

export const ACHIEVEMENTS: Record<AchievementType, Achievement> = {
  FIRST_SCAN: {
    id: 'FIRST_SCAN',
    name: 'First Steps',
    description: 'Complete your first scan',
    rarity: 'COMMON',
    icon: 'Search',
    requirement: { type: 'scans', target: 1 },
    reward: { rzn: 50, energy: 5 }
  },
  FIRST_CRAFT: {
    id: 'FIRST_CRAFT',
    name: 'Apprentice Crafter',
    description: 'Craft your first item',
    rarity: 'COMMON',
    icon: 'FlaskConical',
    requirement: { type: 'crafts', target: 1 },
    reward: { rzn: 75, energy: 5 }
  },
  FIRST_STABILIZE: {
    id: 'FIRST_STABILIZE',
    name: 'Stabilizer',
    description: 'Successfully stabilize for the first time',
    rarity: 'COMMON',
    icon: 'Shield',
    requirement: { type: 'stabilizes', target: 1 },
    reward: { rzn: 100 }
  },
  SCANS_10: {
    id: 'SCANS_10',
    name: 'Scanner',
    description: 'Complete 10 scans',
    rarity: 'COMMON',
    icon: 'Target',
    requirement: { type: 'scans', target: 10 },
    reward: { rzn: 200 }
  },
  SCANS_50: {
    id: 'SCANS_50',
    name: 'Scan Expert',
    description: 'Complete 50 scans',
    rarity: 'UNCOMMON',
    icon: 'Microscope',
    requirement: { type: 'scans', target: 50 },
    reward: { rzn: 500, energy: 10 }
  },
  SCANS_100: {
    id: 'SCANS_100',
    name: 'Scan Master',
    description: 'Complete 100 scans',
    rarity: 'RARE',
    icon: 'Activity',
    requirement: { type: 'scans', target: 100 },
    reward: { rzn: 1000, energy: 20 }
  },
  SCANS_500: {
    id: 'SCANS_500',
    name: 'Scan Legend',
    description: 'Complete 500 scans',
    rarity: 'EPIC',
    icon: 'Radio',
    requirement: { type: 'scans', target: 500 },
    reward: { rzn: 2500, energy: 50 }
  },
  CRAFTS_10: {
    id: 'CRAFTS_10',
    name: 'Dedicated Crafter',
    description: 'Complete 10 crafts',
    rarity: 'COMMON',
    icon: 'Beaker',
    requirement: { type: 'crafts', target: 10 },
    reward: { rzn: 300 }
  },
  CRAFTS_50: {
    id: 'CRAFTS_50',
    name: 'Craft Expert',
    description: 'Complete 50 crafts',
    rarity: 'UNCOMMON',
    icon: 'FlaskRound',
    requirement: { type: 'crafts', target: 50 },
    reward: { rzn: 750, energy: 15 }
  },
  CRAFTS_100: {
    id: 'CRAFTS_100',
    name: 'Master Crafter',
    description: 'Complete 100 crafts',
    rarity: 'RARE',
    icon: 'Atom',
    requirement: { type: 'crafts', target: 100 },
    reward: { rzn: 1500 }
  },
  STABILIZES_10: {
    id: 'STABILIZES_10',
    name: 'Stability Expert',
    description: 'Complete 10 stabilizations',
    rarity: 'UNCOMMON',
    icon: 'Scale',
    requirement: { type: 'stabilizes', target: 10 },
    reward: { rzn: 400 }
  },
  STABILIZES_50: {
    id: 'STABILIZES_50',
    name: 'Stabilization Master',
    description: 'Complete 50 stabilizations',
    rarity: 'RARE',
    icon: 'Battery',
    requirement: { type: 'stabilizes', target: 50 },
    reward: { rzn: 1200 }
  },
  STABILIZES_100: {
    id: 'STABILIZES_100',
    name: 'Stability Legend',
    description: 'Complete 100 stabilizations',
    rarity: 'EPIC',
    icon: 'Wind',
    requirement: { type: 'stabilizes', target: 100 },
    reward: { rzn: 2000 }
  },
  RZN_1000: {
    id: 'RZN_1000',
    name: 'Thousand Club',
    description: 'Earn 1,000 RZN total',
    rarity: 'UNCOMMON',
    icon: 'DollarSign',
    requirement: { type: 'rzn', target: 1000 },
    reward: { energy: 25 }
  },
  RZN_5000: {
    id: 'RZN_5000',
    name: 'High Earner',
    description: 'Earn 5,000 RZN total',
    rarity: 'RARE',
    icon: 'Gem',
    requirement: { type: 'rzn', target: 5000 },
    reward: { energy: 50 }
  },
  RZN_10000: {
    id: 'RZN_10000',
    name: 'RZN Tycoon',
    description: 'Earn 10,000 RZN total',
    rarity: 'EPIC',
    icon: 'Star',
    requirement: { type: 'rzn', target: 10000 },
    reward: { energy: 100 }
  },
  ENERGY_MASTER: {
    id: 'ENERGY_MASTER',
    name: 'Energy Master',
    description: 'Spend 500 energy total',
    rarity: 'RARE',
    icon: 'Zap',
    requirement: { type: 'energy', target: 500 },
    reward: { rzn: 1000 }
  },
  DAILY_STREAK_7: {
    id: 'DAILY_STREAK_7',
    name: 'Week Warrior',
    description: 'Login for 7 consecutive days',
    rarity: 'UNCOMMON',
    icon: 'Clock',
    requirement: { type: 'streak', target: 7 },
    reward: { rzn: 500, energy: 20 }
  },
  DAILY_STREAK_30: {
    id: 'DAILY_STREAK_30',
    name: 'Monthly Master',
    description: 'Login for 30 consecutive days',
    rarity: 'LEGENDARY',
    icon: 'Trophy',
    requirement: { type: 'streak', target: 30 },
    reward: { rzn: 2500, energy: 100 }
  },
  REFERRAL_FIRST: {
    id: 'REFERRAL_FIRST',
    name: 'Friend Maker',
    description: 'Refer your first friend',
    rarity: 'UNCOMMON',
    icon: 'Users',
    requirement: { type: 'referrals', target: 1 },
    reward: { rzn: 300, energy: 15 }
  },
  REFERRAL_10: {
    id: 'REFERRAL_10',
    name: 'Community Builder',
    description: 'Refer 10 friends',
    rarity: 'EPIC',
    icon: 'Users',
    requirement: { type: 'referrals', target: 10 },
    reward: { rzn: 2000, energy: 50 }
  },
  SOCIAL_SHARER: {
    id: 'SOCIAL_SHARER',
    name: 'Social Butterfly',
    description: 'Share an achievement on social media',
    rarity: 'COMMON',
    icon: 'PlayCircle',
    requirement: { type: 'social', target: 1 },
    reward: { rzn: 100, energy: 10 }
  },
  DAILY_SHARE_X: {
    id: 'DAILY_SHARE_X',
    name: 'Daily Spreader',
    description: 'Share on X today',
    rarity: 'COMMON',
    icon: 'Share',
    requirement: { type: 'daily_share', target: 1 },
    reward: { rzn: 150, energy: 10 }
  }
};

export function checkAchievements(stats: UserStats, achievements: UserAchievements): AchievementType[] {
  const newlyUnlocked: AchievementType[] = [];

  Object.values(ACHIEVEMENTS).forEach(achievement => {
    // Skip if already unlocked
    if (achievements.unlocked.includes(achievement.id)) return;

    // Check if requirement is met
    let currentValue = 0;
    switch (achievement.requirement.type) {
      case 'scans':
        currentValue = stats.totalScans;
        break;
      case 'crafts':
        currentValue = stats.totalCrafts;
        break;
      case 'stabilizes':
        currentValue = stats.totalStabilizes;
        break;
      case 'rzn':
        currentValue = stats.totalRznEarned;
        break;
      case 'referrals':
        currentValue = stats.referralsMade;
        break;
      case 'streak':
        currentValue = stats.currentStreak;
        break;
      case 'energy':
        currentValue = stats.energySpent;
        break;
      case 'social':
        currentValue = stats.socialShares;
        break;
      case 'daily_share':
        // Check if user shared today
        const today = new Date().toDateString();
        const lastShareDate = stats.lastDailyShare ? new Date(stats.lastDailyShare).toDateString() : null;
        currentValue = lastShareDate === today ? 1 : 0;
        break;
    }

    if (currentValue >= achievement.requirement.target) {
      newlyUnlocked.push(achievement.id);
    }
  });

  return newlyUnlocked;
}

export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'COMMON':
      return 'text-gray-400 bg-gray-400/10';
    case 'UNCOMMON':
      return 'text-green-400 bg-green-400/10';
    case 'RARE':
      return 'text-blue-400 bg-blue-400/10';
    case 'EPIC':
      return 'text-purple-400 bg-purple-400/10';
    case 'LEGENDARY':
      return 'text-yellow-400 bg-yellow-400/10';
    default:
      return 'text-gray-400 bg-gray-400/10';
  }
}

export function getRarityBorder(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'COMMON':
      return 'border-gray-400/30';
    case 'UNCOMMON':
      return 'border-green-400/30';
    case 'RARE':
      return 'border-blue-400/30';
    case 'EPIC':
      return 'border-purple-400/30 shadow-purple-400/20';
    case 'LEGENDARY':
      return 'border-yellow-400/30 shadow-yellow-400/20';
    default:
      return 'border-gray-400/30';
  }
}