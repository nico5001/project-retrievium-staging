"use client";

import React, { createContext, useContext } from 'react';
import { useAchievements } from '@/hooks/useAchievements';

// Context type
type AchievementContextType = ReturnType<typeof useAchievements> | null;

const AchievementContext = createContext<AchievementContextType>(null);

interface AchievementProviderProps {
  children: React.ReactNode;
  wallet?: string;
}

export function AchievementProvider({ children, wallet }: AchievementProviderProps) {
  const achievementData = useAchievements(wallet);

  return (
    <AchievementContext.Provider value={achievementData}>
      {children}

      {/* Achievement notifications will be rendered by individual components */}
    </AchievementContext.Provider>
  );
}

export function useAchievementContext() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievementContext must be used within an AchievementProvider');
  }
  return context;
}

// Helper components for easy integration

interface AchievementTriggerProps {
  action: 'scan' | 'craft' | 'stabilize' | 'share' | 'referral';
  value?: number;
  children: React.ReactNode;
}

export function AchievementTrigger({ action, value = 1, children }: AchievementTriggerProps) {
  const achievements = useAchievementContext();

  const handleAction = () => {
    switch (action) {
      case 'scan':
        achievements.trackScan();
        break;
      case 'craft':
        achievements.trackCraft();
        break;
      case 'stabilize':
        achievements.trackStabilize();
        break;
      case 'share':
        achievements.trackSocialShare();
        break;
      case 'referral':
        achievements.trackReferral();
        break;
    }
  };

  return (
    <div onClick={handleAction}>
      {children}
    </div>
  );
}

// Stats display component
export function AchievementStats() {
  const { userStats, completionPercentage, unlockedCount, totalAchievements } = useAchievementContext();

  return (
    <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
      <h3 className="text-white font-semibold mb-3">Achievement Progress</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{unlockedCount}</div>
          <div className="text-xs text-white/70">Unlocked</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-400">{completionPercentage}%</div>
          <div className="text-xs text-white/70">Complete</div>
        </div>
      </div>

      <div className="w-full bg-white/10 rounded-full h-2 mb-3">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="text-xs text-white/60">
        {unlockedCount} of {totalAchievements} achievements
      </div>
    </div>
  );
}

// Next achievements component
export function NextAchievements() {
  const { getNextAchievements } = useAchievementContext();
  const nextAchievements = getNextAchievements();

  if (nextAchievements.length === 0) {
    return (
      <div className="text-center py-8 text-white/70">
        🎉 All achievements unlocked!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-white font-semibold mb-3">Next Achievements</h3>
      {nextAchievements.slice(0, 3).map(({ achievement, progress }) => (
        <div key={achievement.id} className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium text-sm">{achievement.name}</h4>
            <span className="text-xs text-white/70">
              {Math.round(progress * 100)}%
            </span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-1 mb-2">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <p className="text-xs text-white/70">{achievement.description}</p>
        </div>
      ))}
    </div>
  );
}