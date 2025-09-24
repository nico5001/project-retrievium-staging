// INTEGRATION GUIDE - How to add these features to your existing play page

import React from 'react';
import Link from 'next/link';
import { AchievementProvider, AchievementTrigger, AchievementStats, NextAchievements } from '@/components/AchievementProvider';
import { AchievementShare } from '@/components/SocialShare';
import ReferralSystem from '@/components/ReferralSystem';

// 1. WRAP YOUR APP with AchievementProvider (in layout.tsx or play page)
export function AppWrapper({ children, wallet }: { children: React.ReactNode; wallet?: string }) {
  return (
    <AchievementProvider wallet={wallet}>
      {children}
    </AchievementProvider>
  );
}

// 2. ADD ACHIEVEMENT TRACKING to existing actions
export function ExistingScanButton() {
  // Your existing scan logic
  const handleScan = async () => {
    // ... existing scan code ...

    // Add this line after successful scan:
    // achievements.trackScan(); - handled automatically by AchievementTrigger
  };

  return (
    <AchievementTrigger action="scan">
      <button onClick={handleScan} className="scan-button">
        Scan Now
      </button>
    </AchievementTrigger>
  );
}

// 3. ADD ACHIEVEMENT WIDGETS to your UI
export function PlayPageSidebar() {
  return (
    <div className="space-y-4">
      {/* Achievement progress widget */}
      <AchievementStats />

      {/* Next achievements to work toward */}
      <NextAchievements />

      {/* Referral system */}
      <ReferralSystem
        wallet="0x123..."
        onRewardClaimed={(amount) => console.log('Earned:', amount)}
      />
    </div>
  );
}

// 4. ADD NAVIGATION LINK to profile page
export function NavigationUpdate() {
  return (
    <nav>
      {/* Your existing nav items */}
      <Link href="/profile" className="nav-link">
        Profile & Achievements
      </Link>
    </nav>
  );
}

// 5. EXAMPLE: Complete integration in your existing component
/*
import { useAchievementContext } from '@/components/AchievementProvider';

export function YourExistingPlayComponent() {
  const achievements = useAchievementContext();

  const handleMissionComplete = (reward: number) => {
    // Your existing logic
    updateRZN(reward);

    // Add achievement tracking
    achievements.trackRznEarned(reward);
  };

  const handleCraftComplete = () => {
    // Your existing logic
    updateInventory();

    // Add achievement tracking
    achievements.trackCraft();
  };

  return (
    <div>
      // Your existing UI

      // Add achievement display
      <div className="achievement-corner">
        <AchievementStats />
      </div>
    </div>
  );
}
*/