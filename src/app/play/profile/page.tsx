"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Users, Zap, Target, FlaskConical, Shield, Star, Calendar, Share2, Copy } from 'lucide-react';
import AchievementBadge from '@/components/AchievementBadge';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { AchievementType, UserStats, UserAchievements } from '@/types/achievements';
import ReferralSystem from '@/components/ReferralSystem';
import { AchievementProvider, useAchievementContext } from '@/components/AchievementProvider';
import { useDailyQuests } from '@/hooks/useDailyQuests';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function StatCard({ icon, label, value, subtitle, color = 'text-blue-400' }: StatCardProps) {
  return (
    <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className={`${color}`}>{icon}</div>
        <span className="text-white/70 text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-white/50">{subtitle}</div>}
    </div>
  );
}

interface AchievementSectionProps {
  title: string;
  achievements: AchievementType[];
  userAchievements: AchievementType[];
}

function AchievementSection({ title, achievements, userAchievements }: AchievementSectionProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        {title}
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
        {achievements.map(achievementId => (
          <AchievementBadge
            key={achievementId}
            achievementId={achievementId}
            unlocked={userAchievements.includes(achievementId)}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}

interface Me {
  wallet: string;
  energy?: number;
  rzn?: number;
  scans_done?: number;
  stabilize_count?: number;
  scan_ready?: boolean;
}

function ProfilePageContent() {
  const router = useRouter();
  const {
    userStats,
    userAchievements,
    completionPercentage,
    unlockedCount,
    totalAchievements
  } = useAchievementContext();

  const [me, setMe] = React.useState<Me | null>(null);
  const [shareUrl, setShareUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const { trackXShare } = useDailyQuests();

  // Fetch user data
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setMe(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  React.useEffect(() => {
    setShareUrl(window.location.origin + '/play/profile');
  }, []);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = async () => {
    try {
      // Use the daily quest tracker
      const shared = await trackXShare();

      if (shared) {
        alert('Daily quest completed! You earned 150 RZN + 10 Energy for sharing! 🎉');
      }
    } catch (error) {
      console.error('Error tracking X share:', error);
      // Fallback to regular share
      const text = `Check out my Project Retrievium profile! I've unlocked ${unlockedCount} achievements and earned ${userStats.totalRznEarned.toLocaleString()} RZN! 🐕⚡`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank');
    }
  };

  // Group achievements by category
  const milestoneAchievements = Object.keys(ACHIEVEMENTS).filter(id =>
    ['SCANS_10', 'SCANS_50', 'SCANS_100', 'SCANS_500', 'CRAFTS_10', 'CRAFTS_50', 'CRAFTS_100', 'STABILIZES_10', 'STABILIZES_50', 'STABILIZES_100'].includes(id)
  ) as AchievementType[];

  const specialAchievements = Object.keys(ACHIEVEMENTS).filter(id =>
    ['FIRST_SCAN', 'FIRST_CRAFT', 'FIRST_STABILIZE', 'ENERGY_MASTER', 'DAILY_STREAK_7', 'DAILY_STREAK_30'].includes(id)
  ) as AchievementType[];

  const socialAchievements = Object.keys(ACHIEVEMENTS).filter(id =>
    ['REFERRAL_FIRST', 'REFERRAL_10', 'SOCIAL_SHARER'].includes(id)
  ) as AchievementType[];

  const wealthAchievements = Object.keys(ACHIEVEMENTS).filter(id =>
    ['RZN_1000', 'RZN_5000', 'RZN_10000'].includes(id)
  ) as AchievementType[];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Neural Network Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950/50 to-black"></div>

      {/* Neural Network Pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Neural connection lines */}
            <pattern id="neuralGrid" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Connection lines */}
              <line x1="0" y1="50" x2="200" y2="150" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="0.5">
                <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="4s" repeatCount="indefinite"/>
              </line>
              <line x1="50" y1="0" x2="150" y2="200" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="0.5">
                <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="6s" repeatCount="indefinite"/>
              </line>
              <line x1="100" y1="0" x2="0" y2="100" stroke="rgba(34, 197, 94, 0.15)" strokeWidth="0.5">
                <animate attributeName="stroke-opacity" values="0.15;0.4;0.15" dur="5s" repeatCount="indefinite"/>
              </line>

              {/* Neural nodes */}
              <circle cx="50" cy="50" r="2" fill="rgba(59, 130, 246, 0.6)">
                <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="fill-opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="150" cy="50" r="1.5" fill="rgba(168, 85, 247, 0.5)">
                <animate attributeName="r" values="1.5;3;1.5" dur="4s" repeatCount="indefinite"/>
                <animate attributeName="fill-opacity" values="0.5;0.9;0.5" dur="4s" repeatCount="indefinite"/>
              </circle>
              <circle cx="100" cy="150" r="2.5" fill="rgba(34, 197, 94, 0.4)">
                <animate attributeName="r" values="2.5;4.5;2.5" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="fill-opacity" values="0.4;0.8;0.4" dur="5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="25" cy="175" r="1" fill="rgba(244, 215, 59, 0.7)">
                <animate attributeName="r" values="1;2.5;1" dur="3.5s" repeatCount="indefinite"/>
                <animate attributeName="fill-opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite"/>
              </circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neuralGrid)"/>
        </svg>
      </div>

      {/* Floating Neural Particles - Reduced for mobile */}
      <div className="absolute inset-0 hidden sm:block">
        {/* Primary nodes */}
        <div className="absolute top-32 left-24 w-3 h-3 bg-blue-400/60 rounded-full shadow-lg shadow-blue-400/50 animate-pulse"></div>
        <div className="absolute top-64 right-40 w-2 h-2 bg-purple-400/50 rounded-full shadow-lg shadow-purple-400/40 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-48 left-40 w-4 h-4 bg-green-400/40 rounded-full shadow-lg shadow-green-400/30 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-96 left-1/2 w-2.5 h-2.5 bg-yellow-400/70 rounded-full shadow-lg shadow-yellow-400/60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-32 right-32 w-3.5 h-3.5 bg-cyan-400/50 rounded-full shadow-lg shadow-cyan-400/40 animate-pulse" style={{animationDelay: '1.5s'}}></div>

        {/* Secondary micro-nodes */}
        <div className="absolute top-48 left-64 w-1 h-1 bg-blue-300/40 rounded-full animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute top-80 right-64 w-1.5 h-1.5 bg-purple-300/30 rounded-full animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-64 left-56 w-1 h-1 bg-green-300/35 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute top-72 right-80 w-1.5 h-1.5 bg-indigo-400/45 rounded-full animate-pulse" style={{animationDelay: '1.8s'}}></div>
      </div>

      {/* Simplified mobile particles */}
      <div className="absolute inset-0 sm:hidden">
        <div className="absolute top-32 left-8 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse"></div>
        <div className="absolute top-64 right-8 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-48 left-12 w-2 h-2 bg-green-400/30 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Subtle Data Flow Effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse" style={{animationDuration: '8s'}}></div>
          <div className="absolute top-2/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse" style={{animationDuration: '10s', animationDelay: '2s'}}></div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-6 sm:pb-8">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <button
          onClick={() => router.push('/play')}
          className="text-white/70 hover:text-white mb-4 sm:mb-6 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          ← Back to Game
        </button>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 truncate">{me?.wallet ? `${me.wallet.slice(0, 6)}...${me.wallet.slice(-4)}` : 'Retriever Player'}</h1>
                  <p className="text-white/60 font-mono text-xs sm:text-sm truncate">{me?.wallet || 'Not Connected'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-0">
                  <div className="text-lg sm:text-2xl font-bold text-white">{unlockedCount}</div>
                  <div className="text-xs text-white/60">Achievements</div>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">{completionPercentage}%</div>
                  <div className="text-xs text-white/60">Complete</div>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <div className="text-lg sm:text-2xl font-bold text-green-400">{userStats.totalScans}</div>
                  <div className="text-xs text-white/60">Total Scans</div>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-400">{userStats.totalRznEarned.toLocaleString()}</div>
                  <div className="text-xs text-white/60">RZN Earned</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg sm:rounded-xl text-white text-sm font-medium transition-all"
              >
                {copied ? <span>Copied!</span> : <><Copy className="w-4 h-4" /> Copy Profile</>}
              </button>
              <button
                onClick={shareOnX}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg sm:rounded-xl text-white text-sm font-medium transition-all shadow-lg"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Achievement Progress */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Achievement Progress</h2>
              <p className="text-white/60 text-xs sm:text-sm hidden sm:block">Your journey through the neural network</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold text-white">{unlockedCount}</div>
            <div className="text-white/60 text-xs sm:text-sm">of {totalAchievements}</div>
          </div>
        </div>

        <div className="relative mb-2 sm:mb-4">
          <div className="w-full bg-white/10 rounded-full h-3 sm:h-4">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 sm:h-4 rounded-full transition-all duration-700 relative overflow-hidden"
              style={{ width: `${completionPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs sm:text-sm font-bold">
            {completionPercentage}%
          </div>
        </div>
      </div>

      {/* Achievement Sections */}
      <div className="space-y-6 sm:space-y-8 lg:space-y-10">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <AchievementSection
            title="Milestone Achievements"
            achievements={milestoneAchievements}
            userAchievements={userAchievements.unlocked}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <AchievementSection
            title="Special Achievements"
            achievements={specialAchievements}
            userAchievements={userAchievements.unlocked}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <AchievementSection
            title="Wealth Achievements"
            achievements={wealthAchievements}
            userAchievements={userAchievements.unlocked}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <AchievementSection
            title="Social Achievements"
            achievements={socialAchievements}
            userAchievements={userAchievements.unlocked}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mt-8 sm:mt-12">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Recent Achievements</h2>
            <p className="text-white/60 text-xs sm:text-sm hidden sm:block">Your latest unlocks</p>
          </div>
        </div>

        {userAchievements.unlocked.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {userAchievements.unlocked.slice(-5).reverse().map(achievementId => {
              const achievement = ACHIEVEMENTS[achievementId];
              return (
                <div key={achievementId} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                  <AchievementBadge achievementId={achievementId} unlocked={true} size="md" showTooltip={false} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm sm:text-base truncate">{achievement.name}</p>
                    <p className="text-xs sm:text-sm text-white/70 line-clamp-2">{achievement.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-white/50 hidden sm:block">Recently</div>
                    {achievement.reward.rzn && (
                      <div className="text-yellow-400 text-xs sm:text-sm font-medium">+{achievement.reward.rzn} RZN</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />
            </div>
            <p className="text-white/70 text-base sm:text-lg font-medium mb-1 sm:mb-2">No achievements unlocked yet</p>
            <p className="text-white/50 text-xs sm:text-sm">Start playing to earn your first achievements!</p>
          </div>
        )}
      </div>

      {/* Referral System */}
      <div className="mt-8 sm:mt-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Referral Program</h2>
            <p className="text-white/60 text-xs sm:text-sm hidden sm:block">Invite friends and earn rewards together</p>
          </div>
        </div>

        <ReferralSystem
          wallet={me?.wallet || ""}
          onRewardClaimed={(amount) => {
            // Track referral reward
            console.log('Referral reward claimed:', amount);
          }}
        />
      </div>
      </div>
    </div>
  );
}

// Wrapper component with AchievementProvider
export default function ProfilePage() {
  const [userWallet, setUserWallet] = React.useState<string>("");

  // Fetch user wallet for AchievementProvider
  React.useEffect(() => {
    const fetchUserWallet = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUserWallet(userData.wallet || "");
        }
      } catch (error) {
        console.error('Error fetching user wallet:', error);
      }
    };

    fetchUserWallet();
  }, []);

  return (
    <AchievementProvider wallet={userWallet}>
      <ProfilePageContent />
    </AchievementProvider>
  );
}