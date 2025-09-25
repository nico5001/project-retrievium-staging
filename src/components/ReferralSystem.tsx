"use client";

import React, { useState, useEffect } from 'react';
import { Copy, Users, Gift, ExternalLink, CheckCircle, Star } from 'lucide-react';
// Removed referralService import - using simplified referral system
import { useDailyQuests } from '@/hooks/useDailyQuests';
import ReferralBonusTracker from '@/components/ReferralBonusTracker';

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalRewardsEarned: number;
  dailyRevenueShare: number;
  referralUrl: string;
  recentEarnings: {
    wallet: string;
    amount: number;
    source: string;
    timestamp: Date;
    type: 'revenue_share' | 'milestone';
  }[];
  referredUsers: {
    wallet: string;
    joinDate: Date;
    totalEarned: number;
    lastActive: Date;
  }[];
}

interface ReferralSystemProps {
  wallet?: string;
  onRewardClaimed?: (amount: number) => void;
}

export default function ReferralSystem({ wallet, onRewardClaimed }: ReferralSystemProps) {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReferrer, setHasReferrer] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<string | null>(null);
  const [referralUrl, setReferralUrl] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const { trackXShare } = useDailyQuests();

  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    const loadReferralData = async () => {
      try {
        // Check for custom referral code first, fallback to wallet-based code
        let resolvedCode = wallet.slice(2, 8).toUpperCase(); // Default wallet-based code

        try {
          const customCodeResponse = await fetch(`/api/custom-referral-code?wallet=${wallet}`);
          if (customCodeResponse.ok) {
            const customData = await customCodeResponse.json();
            if (customData.customCode) {
              resolvedCode = customData.customCode;
            }
          }
        } catch (error) {
          console.error('Error fetching custom referral code:', error);
        }

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const finalUrl = `${baseUrl}?ref=${resolvedCode}`;
        setReferralUrl(finalUrl);
        setReferralCode(resolvedCode);

      } catch (error) {
        console.error('Error loading referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReferralData();
  }, [wallet]);

  // Data is automatically saved to Supabase

  const copyReferralUrl = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = async () => {
    try {
      // Use the daily quest tracker which includes window detection
      const shared = await trackXShare();

      if (shared) {
        // Show success message
        alert('Daily quest completed! You earned 150 RZN + 10 Energy for sharing! 🎉');

        // Optional: trigger reward callback
        if (onRewardClaimed) {
          onRewardClaimed(150);
        }
      }
    } catch (error) {
      console.error('Error tracking X share:', error);
      // Fallback to regular share
      const text = `Join me in Project Retrievium! Use my referral link to get bonus rewards when you mint your first dog. 🐕⚡`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`;
      window.open(url, '_blank');
    }
  };

  const shareOnDiscord = () => {
    // For Discord, we'll just copy the message format
    const message = `Join me in Project Retrievium! Use my referral link to get bonus rewards: ${referralUrl} 🐕⚡`;
    navigator.clipboard.writeText(message);
    alert('Referral message copied! Paste it in Discord.');
  };

  const submitReferralCode = async () => {
    if (!inputCode.trim() || !wallet) return;

    setIsSubmitting(true);

    try {
      // Use our resolve API to check the referral code
      const resolveResponse = await fetch(`/api/resolve-referral-code?code=${inputCode.toUpperCase()}`);
      const resolveData = await resolveResponse.json();

      if (resolveResponse.ok && resolveData.wallet) {
        // Store referral relationship
        localStorage.setItem(`referrer_${wallet}`, JSON.stringify({
          referrer: resolveData.wallet,
          joinDate: new Date().toISOString(),
          referralCode: inputCode.toUpperCase()
        }));

        // Update UI state
        setHasReferrer(true);
        setReferrerInfo(inputCode.toUpperCase());
        setInputCode('');

        alert('Referral code successfully applied! Your referrer will now get bonuses from your activity.');
      } else {
        alert(resolveData.error || 'Invalid referral code. Please try again.');
      }

    } catch (error) {
      console.error('Error applying referral code:', error);
      alert('Error applying referral code. Please try again.');
    }

    setIsSubmitting(false);
  };


  if (loading) {
    return (
      <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Referral Overview */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">Referral Program</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-white mb-1">0</div>
            <div className="text-xs sm:text-sm text-white/70">Total Referrals</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-green-400 mb-1">0</div>
            <div className="text-xs sm:text-sm text-white/70">Active This Week</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-yellow-400 mb-1">0</div>
            <div className="text-xs sm:text-sm text-white/70">Total RZN Earned</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-purple-400 mb-1">0</div>
            <div className="text-xs sm:text-sm text-white/70">Today's 5% Share</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-white mb-2">Your Referral Code</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white font-mono text-xs sm:text-sm min-w-0 overflow-hidden">
                {referralCode || (wallet ? wallet.slice(2, 8).toUpperCase() : '')}
              </code>
              <button
                onClick={copyReferralUrl}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs sm:text-sm transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-white mb-2">Full Referral URL</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-xs sm:text-sm min-w-0 truncate"
              />
              <button
                onClick={copyReferralUrl}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs sm:text-sm transition flex items-center justify-center"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={shareOnX}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs sm:text-sm font-medium transition"
          >
            <ExternalLink className="w-4 h-4" />
            Share on X
          </button>
          <button
            onClick={shareOnDiscord}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-xs sm:text-sm font-medium transition"
          >
            <Copy className="w-4 h-4" />
            Copy for Discord
          </button>
        </div>
      </div>

      {/* Enter Referral Code Section */}
      {!hasReferrer ? (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-start sm:items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Enter a Referral Code</h3>
              <p className="text-xs sm:text-sm text-white/70 leading-tight">Got a friend's referral code? Enter it to give them 5% of your RZN earnings!</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Enter referral code (e.g. ABC123)"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/50 text-xs sm:text-sm font-mono min-w-0"
              maxLength={10}
            />
            <button
              onClick={submitReferralCode}
              disabled={!inputCode.trim() || isSubmitting}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
            >
              {isSubmitting ? 'Applying...' : 'Apply Code'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Referral Active</h3>
          </div>
          <p className="text-white/70 text-sm mb-2">
            You're referred by: <span className="font-mono text-green-400">{referrerInfo}</span>
          </p>
          <p className="text-xs text-white/50">
            Your referrer gets 5% of all RZN you earn. Keep playing to help them out!
          </p>
        </div>
      )}

      {/* Referral Rewards */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Referral Rewards</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-400/30">
            <div>
              <div className="text-white font-medium flex items-center gap-2">
                <Star className="w-4 h-4 text-green-400" />
                Revenue Share (Ongoing)
              </div>
              <div className="text-sm text-white/70">Get 5% of all RZN your referrals earn forever</div>
            </div>
            <div className="text-green-400 font-bold">5% Forever</div>
          </div>


          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-purple-400/30">
            <div>
              <div className="text-white font-medium flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                10 Active Referrals
              </div>
              <div className="text-sm text-white/70">Achievement for having 10 actively playing friends</div>
            </div>
            <div className="text-purple-400 font-bold">+2000 RZN</div>
          </div>
        </div>
      </div>

      {/* Recent Earnings */}
      {referralData?.recentEarnings && referralData.recentEarnings.length > 0 && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Referral Earnings</h3>
          <div className="space-y-3">
            {referralData.recentEarnings.slice(-10).reverse().map((earning, index) => {
              const timestamp = new Date(earning.timestamp);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      earning.type === 'revenue_share' ? 'bg-green-400' : 'bg-purple-400'
                    }`} />
                    <div>
                      <div className="text-white font-mono text-sm">
                        {earning.wallet.slice(0, 6)}...{earning.wallet.slice(-4)}
                      </div>
                      <div className="text-xs text-white/70">
                        {earning.type === 'revenue_share' ? '5% Share from' : 'Milestone:'} {earning.source}
                      </div>
                      <div className="text-xs text-white/50">
                        {timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      earning.type === 'revenue_share' ? 'text-green-400' : 'text-purple-400'
                    }`}>
                      +{earning.amount} RZN
                    </div>
                    <div className="text-xs text-white/70 capitalize">
                      {earning.type === 'revenue_share' ? 'Revenue Share' : 'Milestone Bonus'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referral Bonus Tracker for invited users */}
      <ReferralBonusTracker
        wallet={wallet}
        onBonusUnlocked={(bonus, reward) => {
          console.log('Referral bonus unlocked:', bonus.name, reward);
          // Optional: Show notification or trigger callback
        }}
      />

      {/* How It Works */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">How It Works</h3>
        <div className="space-y-3 text-xs sm:text-sm text-white/70">
          <div className="flex gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">1</div>
            <div>Share your referral link with friends</div>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">2</div>
            <div>They visit the site using your link and connect their wallet</div>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">3</div>
            <div>When they start playing and earning RZN, you get 5% of everything they earn</div>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">4</div>
            <div>Revenue share continues forever - the more they play, the more you earn!</div>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">+</div>
            <div>New players get progressive bonuses for completing their first activities!</div>
          </div>
        </div>
      </div>
    </div>
  );
}