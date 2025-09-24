import { createBrowserClient } from '@supabase/ssr';

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalRewardsEarned: number;
  dailyRevenueShare: number;
  recentEarnings: Array<{
    wallet: string;
    amount: number;
    source: string;
    timestamp: string;
    type: string;
  }>;
  referredUsers: Array<{
    wallet: string;
    joinDate: string;
    totalEarned: number;
    lastActive: string;
  }>;
  referrerInfo: {
    hasReferrer: boolean;
    referrerCode?: string;
    referrerWallet?: string;
  };
}

export interface UserStats {
  totalScans: number;
  totalCrafts: number;
  totalStabilizes: number;
  totalRznEarned: number;
  currentStreak: number;
  longestStreak: number;
  referralsMade: number;
  socialShares: number;
  energySpent: number;
  lastLogin: Date;
}

export class ReferralService {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async getReferralStats(walletAddress: string): Promise<ReferralStats | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_referral_stats', {
        user_wallet: walletAddress
      });

      if (error) {
        console.error('Error getting referral stats:', error);
        return null;
      }

      if (!data.success) {
        console.error('Failed to get referral stats:', data.error);
        return null;
      }

      return {
        referralCode: data.referralCode,
        totalReferrals: data.totalReferrals,
        activeReferrals: data.activeReferrals,
        totalRewardsEarned: data.totalRewardsEarned,
        dailyRevenueShare: data.dailyRevenueShare,
        recentEarnings: data.recentEarnings || [],
        referredUsers: data.referredUsers || [],
        referrerInfo: data.referrerInfo || { hasReferrer: false }
      };
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      return null;
    }
  }

  async applyReferralCode(walletAddress: string, referralCode: string): Promise<{
    success: boolean;
    error?: string;
    referrerWallet?: string;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('apply_referral_code', {
        referee_wallet: walletAddress,
        referral_code: referralCode
      });

      if (error) {
        console.error('Error applying referral code:', error);
        return { success: false, error: 'Database error' };
      }

      return data;
    } catch (error) {
      console.error('Error in applyReferralCode:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async awardRzn(walletAddress: string, amount: number, source: string = 'game'): Promise<{
    success: boolean;
    userEarned: number;
    referrerEarned: number;
    referrerWallet?: string;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('award_rzn_with_referral', {
        user_wallet: walletAddress,
        amount: amount,
        source: source
      });

      if (error) {
        console.error('Error awarding RZN:', error);
        return { success: false, userEarned: 0, referrerEarned: 0 };
      }

      return {
        success: data.success,
        userEarned: data.user_earned,
        referrerEarned: data.referrer_earned,
        referrerWallet: data.referrer_wallet
      };
    } catch (error) {
      console.error('Error in awardRzn:', error);
      return { success: false, userEarned: 0, referrerEarned: 0 };
    }
  }

  async trackUserAction(walletAddress: string, actionType: string, amount: number = 1): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('track_user_action', {
        user_wallet: walletAddress,
        action_type: actionType,
        amount: amount
      });

      if (error) {
        console.error('Error tracking user action:', error);
        return false;
      }

      return data.success;
    } catch (error) {
      console.error('Error in trackUserAction:', error);
      return false;
    }
  }

  async getUserStats(walletAddress: string): Promise<UserStats | null> {
    try {
      // Get or create user first
      const { data: userData, error: userError } = await this.supabase.rpc('get_or_create_user', {
        wallet_addr: walletAddress
      });

      if (userError) {
        console.error('Error getting user:', userError);
        return null;
      }

      // Get user stats
      const { data: statsData, error: statsError } = await this.supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (statsError) {
        console.error('Error getting user stats:', statsError);
        return null;
      }

      return {
        totalScans: statsData.total_scans || 0,
        totalCrafts: statsData.total_crafts || 0,
        totalStabilizes: statsData.total_stabilizes || 0,
        totalRznEarned: statsData.total_rzn_earned || 0,
        currentStreak: statsData.current_streak || 0,
        longestStreak: statsData.longest_streak || 0,
        referralsMade: statsData.referrals_made || 0,
        socialShares: statsData.social_shares || 0,
        energySpent: statsData.energy_spent || 0,
        lastLogin: new Date(statsData.last_login)
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return null;
    }
  }

  // Achievement related functions
  async getUserAchievements(walletAddress: string): Promise<string[]> {
    try {
      // Get user wallet first
      const { data: userData } = await this.supabase
        .from('players')
        .select('wallet')
        .eq('wallet', walletAddress)
        .single();

      if (!userData) return [];

      const { data, error } = await this.supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('wallet_address', userData.wallet);

      if (error) {
        console.error('Error getting user achievements:', error);
        return [];
      }

      return data.map(a => a.achievement_id);
    } catch (error) {
      console.error('Error in getUserAchievements:', error);
      return [];
    }
  }

  async unlockAchievement(walletAddress: string, achievementId: string): Promise<boolean> {
    try {
      // Get user wallet first
      const { data: userData } = await this.supabase
        .from('players')
        .select('wallet')
        .eq('wallet', walletAddress)
        .single();

      if (!userData) return false;

      const { error } = await this.supabase
        .from('user_achievements')
        .upsert({
          wallet_address: userData.wallet,
          achievement_id: achievementId
        }, {
          onConflict: 'wallet_address,achievement_id'
        });

      if (error) {
        console.error('Error unlocking achievement:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in unlockAchievement:', error);
      return false;
    }
  }
}

// Export singleton instance
export const referralService = new ReferralService();