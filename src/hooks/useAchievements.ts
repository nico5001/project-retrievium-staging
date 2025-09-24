"use client";

import { useState, useEffect, useCallback } from 'react';
import { Achievement, AchievementType, UserStats, UserAchievements } from '@/types/achievements';
import { ACHIEVEMENTS, checkAchievements } from '@/lib/achievements';

interface AchievementNotification {
  id: string;
  achievement: Achievement;
  timestamp: Date;
}

export function useAchievements(wallet?: string) {
  const [userStats, setUserStats] = useState<UserStats>({
    totalScans: 0,
    totalCrafts: 0,
    totalStabilizes: 0,
    totalRznEarned: 0,
    currentStreak: 0,
    longestStreak: 0,
    referralsMade: 0,
    socialShares: 0,
    lastLogin: new Date(),
    energySpent: 0
  });

  const [userAchievements, setUserAchievements] = useState<UserAchievements>({
    unlocked: [],
    progress: {} as Record<AchievementType, number>,
    lastChecked: new Date()
  });

  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);

  // Load user data
  useEffect(() => {
    if (!wallet) return;

    // Load from localStorage (replace with API call)
    const savedStats = localStorage.getItem(`achievementStats_${wallet}`);
    const savedAchievements = localStorage.getItem(`achievements_${wallet}`);

    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }

    if (savedAchievements) {
      setUserAchievements(JSON.parse(savedAchievements));
    }
  }, [wallet]);

  // Save user data
  const saveData = useCallback(() => {
    if (!wallet) return;

    localStorage.setItem(`achievementStats_${wallet}`, JSON.stringify(userStats));
    localStorage.setItem(`achievements_${wallet}`, JSON.stringify(userAchievements));
  }, [wallet, userStats, userAchievements]);

  // Check for new achievements
  const checkForNewAchievements = useCallback(() => {
    const newlyUnlocked = checkAchievements(userStats, userAchievements);

    if (newlyUnlocked.length > 0) {
      const newNotifications: AchievementNotification[] = newlyUnlocked.map(achievementId => ({
        id: `${achievementId}_${Date.now()}`,
        achievement: ACHIEVEMENTS[achievementId],
        timestamp: new Date()
      }));

      setNotifications(prev => [...prev, ...newNotifications]);
      setUserAchievements(prev => ({
        ...prev,
        unlocked: [...prev.unlocked, ...newlyUnlocked],
        lastChecked: new Date()
      }));

      // Calculate total rewards
      const totalRewards = newlyUnlocked.reduce((acc, achievementId) => {
        const achievement = ACHIEVEMENTS[achievementId];
        return {
          rzn: acc.rzn + (achievement.reward.rzn || 0),
          energy: acc.energy + (achievement.reward.energy || 0)
        };
      }, { rzn: 0, energy: 0 });

      return { achievements: newlyUnlocked, rewards: totalRewards };
    }

    return null;
  }, [userStats, userAchievements]);

  // Update stats functions
  const updateStats = useCallback((updates: Partial<UserStats>) => {
    setUserStats(prev => {
      const newStats = { ...prev, ...updates };

      // Auto-check for achievements after stats update
      setTimeout(() => {
        checkForNewAchievements();
      }, 100);

      return newStats;
    });
  }, [checkForNewAchievements]);

  const incrementStat = useCallback((statName: keyof UserStats, amount: number = 1) => {
    const currentValue = userStats[statName];
    const newValue = typeof currentValue === 'number' ? currentValue + amount : amount;
    updateStats({ [statName]: newValue } as Partial<UserStats>);
  }, [userStats, updateStats]);

  // Track specific actions
  const trackScan = useCallback(() => {
    incrementStat('totalScans');
  }, [incrementStat]);

  const trackCraft = useCallback(() => {
    incrementStat('totalCrafts');
  }, [incrementStat]);

  const trackStabilize = useCallback(() => {
    incrementStat('totalStabilizes');
  }, [incrementStat]);

  const trackRznEarned = useCallback((amount: number, source: string = 'game') => {
    incrementStat('totalRznEarned', amount);

    // Check if user has a referrer and award 5% revenue share
    if (wallet) {
      const referrer = getReferrer(wallet);
      if (referrer) {
        const revenueShare = Math.floor(amount * 0.05);
        if (revenueShare > 0) {
          awardReferralRevenue(referrer, wallet, revenueShare, source);
        }
      }
    }
  }, [incrementStat, wallet]);

  const trackEnergySpent = useCallback((amount: number) => {
    incrementStat('energySpent', amount);
  }, [incrementStat]);

  const trackReferral = useCallback(() => {
    incrementStat('referralsMade');
  }, [incrementStat]);

  const trackSocialShare = useCallback(() => {
    incrementStat('socialShares');
  }, [incrementStat]);

  const updateStreak = useCallback((newStreak: number) => {
    updateStats({
      currentStreak: newStreak,
      longestStreak: Math.max(userStats.longestStreak, newStreak),
      lastLogin: new Date()
    });
  }, [userStats.longestStreak, updateStats]);

  // Notification management
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper functions for referral system
  const getReferrer = useCallback((userWallet: string): string | null => {
    const referralData = localStorage.getItem(`referrer_${userWallet}`);
    return referralData ? JSON.parse(referralData).referrer : null;
  }, []);

  const setReferralRelationship = useCallback((referrerWallet: string, refereeWallet: string) => {
    localStorage.setItem(`referrer_${refereeWallet}`, JSON.stringify({
      referrer: referrerWallet,
      joinDate: new Date().toISOString()
    }));
  }, []);

  const awardReferralRevenue = useCallback((referrerWallet: string, refereeWallet: string, amount: number, source: string) => {
    // Award RZN to referrer
    const referrerStats = localStorage.getItem(`achievementStats_${referrerWallet}`);
    if (referrerStats) {
      const stats = JSON.parse(referrerStats);
      stats.totalRznEarned = (stats.totalRznEarned || 0) + amount;
      localStorage.setItem(`achievementStats_${referrerWallet}`, JSON.stringify(stats));
    }

    // Update referrer's referral data
    const referralData = localStorage.getItem(`referrals_${referrerWallet}`);
    if (referralData) {
      const data = JSON.parse(referralData);
      data.totalRewardsEarned = (data.totalRewardsEarned || 0) + amount;
      data.dailyRevenueShare = (data.dailyRevenueShare || 0) + amount; // Reset daily at midnight

      // Add to recent earnings
      data.recentEarnings = data.recentEarnings || [];
      data.recentEarnings.push({
        wallet: refereeWallet,
        amount: amount,
        source: source,
        timestamp: new Date(),
        type: 'revenue_share'
      });

      // Keep only last 50 earnings
      if (data.recentEarnings.length > 50) {
        data.recentEarnings = data.recentEarnings.slice(-50);
      }

      localStorage.setItem(`referrals_${referrerWallet}`, JSON.stringify(data));
    }
  }, []);

  // Save data when it changes
  useEffect(() => {
    saveData();
  }, [saveData]);

  // Get achievement progress
  const getAchievementProgress = useCallback((achievementId: AchievementType) => {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return 0;

    let currentValue = 0;
    switch (achievement.requirement.type) {
      case 'scans':
        currentValue = userStats.totalScans;
        break;
      case 'crafts':
        currentValue = userStats.totalCrafts;
        break;
      case 'stabilizes':
        currentValue = userStats.totalStabilizes;
        break;
      case 'rzn':
        currentValue = userStats.totalRznEarned;
        break;
      case 'referrals':
        currentValue = userStats.referralsMade;
        break;
      case 'streak':
        currentValue = userStats.currentStreak;
        break;
      case 'energy':
        currentValue = userStats.energySpent;
        break;
      case 'social':
        currentValue = userStats.socialShares;
        break;
    }

    return Math.min(currentValue / achievement.requirement.target, 1);
  }, [userStats]);

  const getNextAchievements = useCallback(() => {
    return Object.values(ACHIEVEMENTS)
      .filter(achievement => !userAchievements.unlocked.includes(achievement.id))
      .map(achievement => ({
        achievement,
        progress: getAchievementProgress(achievement.id)
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);
  }, [userAchievements.unlocked, getAchievementProgress]);

  return {
    // State
    userStats,
    userAchievements,
    notifications,

    // Actions
    trackScan,
    trackCraft,
    trackStabilize,
    trackRznEarned,
    trackEnergySpent,
    trackReferral,
    trackSocialShare,
    updateStreak,
    updateStats,

    // Referral functions
    getReferrer,
    setReferralRelationship,
    awardReferralRevenue,

    // Utilities
    checkForNewAchievements,
    getAchievementProgress,
    getNextAchievements,
    dismissNotification,
    clearAllNotifications,

    // Computed values
    totalAchievements: Object.keys(ACHIEVEMENTS).length,
    unlockedCount: userAchievements.unlocked.length,
    completionPercentage: Math.round((userAchievements.unlocked.length / Object.keys(ACHIEVEMENTS).length) * 100)
  };
}