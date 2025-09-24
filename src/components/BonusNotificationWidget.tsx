"use client";

import React, { useState, useEffect } from 'react';
import { Gift, ChevronRight, Clock, Star } from 'lucide-react';
import Link from 'next/link';

interface BonusNotification {
  id: string;
  name: string;
  reward: { rzn?: number; energy?: number };
  readyToClaim: boolean;
}

interface BonusNotificationWidgetProps {
  wallet?: string;
}

export default function BonusNotificationWidget({ wallet }: BonusNotificationWidgetProps) {
  const [bonusData, setBonusData] = useState<{
    readyToClaim: BonusNotification[];
    totalPotential: number;
    isReferred: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

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

        if (data.isReferred) {
          const readyToClaim = data.bonuses
            .filter((bonus: any) => bonus.newlyUnlocked && !bonus.unlocked)
            .map((bonus: any) => ({
              id: bonus.id,
              name: bonus.name,
              reward: bonus.reward,
              readyToClaim: true
            }));

          const totalPotentialRzn = data.totalPotential?.rzn || 0;

          setBonusData({
            readyToClaim,
            totalPotential: totalPotentialRzn,
            isReferred: true
          });
        } else {
          setBonusData({ readyToClaim: [], totalPotential: 0, isReferred: false });
        }
      }
    } catch (error) {
      console.error('Error loading bonus data:', error);
      setBonusData({ readyToClaim: [], totalPotential: 0, isReferred: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !bonusData?.isReferred) {
    return null; // Don't show for non-referred users or while loading
  }

  const { readyToClaim, totalPotential } = bonusData;
  const hasClaimableBonuses = readyToClaim.length > 0;

  return (
    <div className={`rounded-xl border backdrop-blur-sm p-4 transition-all ${
      hasClaimableBonuses
        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 animate-pulse'
        : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-400/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            hasClaimableBonuses
              ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
              : 'bg-gradient-to-br from-purple-500 to-pink-600'
          }`}>
            {hasClaimableBonuses ? (
              <Star className="w-5 h-5 text-white" />
            ) : (
              <Gift className="w-5 h-5 text-white" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              {hasClaimableBonuses ? 'Bonuses Ready!' : 'Referral Bonuses'}
            </h3>
            <div className="text-xs text-white/70">
              {hasClaimableBonuses ? (
                <>
                  {readyToClaim.length} bonus{readyToClaim.length > 1 ? 'es' : ''} ready to claim
                </>
              ) : (
                <>
                  Complete activities to unlock rewards up to {totalPotential} RZN
                </>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/play/profile"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            hasClaimableBonuses
              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
        >
          {hasClaimableBonuses ? 'Claim Now' : 'View All'}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick bonus preview */}
      {hasClaimableBonuses && readyToClaim.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Clock className="w-3 h-3" />
            <span>Next: {readyToClaim[0].name}</span>
            <span className="text-yellow-300 font-medium">
              +{readyToClaim[0].reward.rzn} RZN
              {/* Energy rewards removed from referral system */}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}