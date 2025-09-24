"use client";

import React, { useState, useEffect } from 'react';
import { Gift, Clock, CheckCircle, Lock, Star, Zap } from 'lucide-react';

interface ReferralBonus {
  id: string;
  name: string;
  description: string;
  trigger: string;
  reward: {
    rzn?: number;
    energy?: number;
    items?: { item: string; qty: number }[];
  };
  unlocked: boolean;
  newlyUnlocked: boolean;
  unlockedAt?: string;
}

interface ReferralBonusData {
  isReferred: boolean;
  referredBy?: string;
  bonuses: ReferralBonus[];
  newlyUnlocked: string[];
  nextBonus?: ReferralBonus;
  totalPotential: {
    rzn: number;
    energy: number;
    items: { item: string; qty: number }[];
  };
}

interface ReferralBonusTrackerProps {
  wallet?: string;
  onBonusUnlocked?: (bonus: ReferralBonus, reward: any) => void;
}

export default function ReferralBonusTracker({ wallet, onBonusUnlocked }: ReferralBonusTrackerProps) {
  const [bonusData, setBonusData] = useState<ReferralBonusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingBonus, setClaimingBonus] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    loadBonusData();
  }, [wallet]);

  const loadBonusData = async () => {
    try {
      const response = await fetch('/api/referral-bonuses', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setBonusData(data);

        // Show notifications for newly unlocked bonuses
        if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
          data.newlyUnlocked.forEach((bonusId: string) => {
            const bonus = data.bonuses.find((b: ReferralBonus) => b.id === bonusId);
            if (bonus) {
              showBonusNotification(bonus);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading referral bonuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const showBonusNotification = (bonus: ReferralBonus) => {
    // You can integrate this with your existing toast system
    const message = `🎉 New referral bonus unlocked: ${bonus.name}! Click to claim your reward.`;
    console.log(message);
  };

  const unlockBonus = async (bonusId: string) => {
    if (!wallet || claimingBonus) return;

    setClaimingBonus(bonusId);

    try {
      const response = await fetch('/api/referral-bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'unlock', bonusId })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state
        setBonusData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            bonuses: prev.bonuses.map(bonus =>
              bonus.id === bonusId
                ? { ...bonus, unlocked: true, unlockedAt: new Date().toISOString() }
                : bonus
            )
          };
        });

        // Trigger callback
        if (onBonusUnlocked) {
          const bonus = bonusData?.bonuses.find(b => b.id === bonusId);
          if (bonus) {
            onBonusUnlocked(bonus, result.bonus.reward);
          }
        }

        // Show success message
        alert(result.message || 'Bonus unlocked successfully!');

      } else {
        alert(result.error || 'Failed to unlock bonus');
      }

    } catch (error) {
      console.error('Error unlocking bonus:', error);
      alert('Error unlocking bonus. Please try again.');
    }

    setClaimingBonus(null);
  };

  if (loading) {
    return (
      <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!bonusData?.isReferred) {
    return null; // Don't show anything for non-referred users
  }

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
          <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Referral Bonuses</h3>
          <p className="text-xs sm:text-sm text-white/70">Complete activities to unlock rewards!</p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-white/10 rounded-lg">
          <div className="text-lg font-bold text-white">
            {bonusData.bonuses.filter(b => b.unlocked).length}/{bonusData.bonuses.length}
          </div>
          <div className="text-xs text-white/60">Unlocked</div>
        </div>
        <div className="text-center p-3 bg-white/10 rounded-lg">
          <div className="text-lg font-bold text-green-400">
            {bonusData.bonuses.filter(b => b.unlocked).reduce((sum, b) => sum + (b.reward.rzn || 0), 0)}
          </div>
          <div className="text-xs text-white/60">RZN Earned</div>
        </div>
        <div className="text-center p-3 bg-white/10 rounded-lg col-span-2 sm:col-span-1">
          <div className="text-lg font-bold text-blue-400">
            {bonusData.totalPotential.rzn}
          </div>
          <div className="text-xs text-white/60">Total Potential</div>
        </div>
      </div>

      {/* Bonus List */}
      <div className="space-y-3">
        {bonusData.bonuses.map(bonus => {
          const isReadyToUnlock = bonus.newlyUnlocked && !bonus.unlocked;

          return (
            <div
              key={bonus.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
                bonus.unlocked
                  ? 'bg-green-500/20 border-green-400/30'
                  : isReadyToUnlock
                  ? 'bg-yellow-500/20 border-yellow-400/30 animate-pulse'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  bonus.unlocked
                    ? 'bg-green-500'
                    : isReadyToUnlock
                    ? 'bg-yellow-500'
                    : 'bg-white/20'
                }`}>
                  {bonus.unlocked ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : isReadyToUnlock ? (
                    <Star className="w-4 h-4 text-white" />
                  ) : (
                    <Lock className="w-4 h-4 text-white/70" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm sm:text-base truncate">{bonus.name}</p>
                  <p className="text-xs sm:text-sm text-white/60 truncate">{bonus.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0">
                <div className="text-white/40 text-xs sm:text-sm font-mono">
                  {bonus.reward.rzn ? `${bonus.reward.rzn} RZN` : ''}
                </div>
                <div className="shrink-0">
                  {bonus.unlocked ? (
                    <div className="text-green-400 text-xs sm:text-sm font-medium px-3 py-1.5 bg-green-500/20 rounded">
                      ✓ Claimed
                    </div>
                  ) : isReadyToUnlock ? (
                    <button
                      onClick={() => unlockBonus(bonus.id)}
                      disabled={claimingBonus === bonus.id}
                      className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-xs sm:text-sm font-medium transition-all min-w-[70px] sm:min-w-[80px]"
                    >
                      {claimingBonus === bonus.id ? 'Claiming...' : 'Claim'}
                    </button>
                  ) : (
                    <div className="text-white/30 text-xs px-3 py-1.5 bg-white/5 rounded">
                      Locked
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Bonus Hint */}
      {bonusData.nextBonus && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Next Bonus:</span>
          </div>
          <p className="text-white/80 text-xs">
            {bonusData.nextBonus.description} • Reward: {bonusData.nextBonus.reward.rzn} RZN
            {/* Energy rewards removed from referral system */}
          </p>
        </div>
      )}
    </div>
  );
}