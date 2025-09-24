"use client";

import React, { useState } from 'react';
import { Share2, Twitter, MessageSquare, Copy, ExternalLink, Trophy, Zap, Target } from 'lucide-react';
import { Achievement } from '@/types/achievements';
import { ACHIEVEMENTS } from '@/lib/achievements';

interface SocialShareProps {
  type: 'achievement' | 'milestone' | 'stats' | 'general';
  data?: {
    achievement?: Achievement;
    stats?: {
      scans?: number;
      crafts?: number;
      rzn?: number;
      level?: number;
    };
    milestone?: {
      type: string;
      value: number;
    };
    customMessage?: string;
  };
  onShare?: (platform: string) => void;
}

export default function SocialShare({ type, data, onShare }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMessage = (): { text: string; url: string } => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const gameUrl = `${baseUrl}/play`;

    switch (type) {
      case 'achievement':
        if (data?.achievement) {
          return {
            text: `🏆 Achievement Unlocked: "${data.achievement.name}"! ${data.achievement.description} Just achieved this in @ProjectRetrievium! 🐕⚡`,
            url: gameUrl
          };
        }
        break;

      case 'milestone':
        if (data?.milestone) {
          return {
            text: `🎯 New milestone reached! Just hit ${data.milestone.value.toLocaleString()} ${data.milestone.type} in @ProjectRetrievium! Who's ready to join the pack? 🐕⚡`,
            url: gameUrl
          };
        }
        break;

      case 'stats':
        if (data?.stats) {
          const { scans = 0, crafts = 0, rzn = 0, level = 1 } = data.stats;
          return {
            text: `📊 My @ProjectRetrievium stats:\n🔍 ${scans.toLocaleString()} scans\n⚗️ ${crafts.toLocaleString()} crafts\n💎 ${rzn.toLocaleString()} RZN earned\n⭐ Level ${level}\n\nJoin the pack! 🐕⚡`,
            url: gameUrl
          };
        }
        break;

      case 'general':
        return {
          text: data?.customMessage || `Playing @ProjectRetrievium and loving it! Join me in this epic dog-themed Web3 adventure! 🐕⚡`,
          url: gameUrl
        };
    }

    return {
      text: `Check out @ProjectRetrievium - an awesome Web3 game with dogs! 🐕⚡`,
      url: gameUrl
    };
  };

  const shareOnX = () => {
    const { text, url } = generateMessage();
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(xUrl, '_blank', 'width=600,height=400');
    onShare?.('x');
    setIsOpen(false);
  };

  const shareOnDiscord = () => {
    const { text, url } = generateMessage();
    const message = `${text}\n\n${url}`;
    navigator.clipboard.writeText(message);
    alert('Message copied! Paste it in Discord.');
    onShare?.('discord');
    setIsOpen(false);
  };

  const copyLink = async () => {
    const { text, url } = generateMessage();
    const fullMessage = `${text}\n\n${url}`;
    await navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShare?.('copy');
  };

  const getShareIcon = () => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-4 h-4" />;
      case 'milestone':
        return <Target className="w-4 h-4" />;
      case 'stats':
        return <Zap className="w-4 h-4" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getShareTitle = () => {
    switch (type) {
      case 'achievement':
        return 'Share Achievement';
      case 'milestone':
        return 'Share Milestone';
      case 'stats':
        return 'Share Stats';
      default:
        return 'Share';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition"
      >
        {getShareIcon()}
        {getShareTitle()}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Share menu */}
          <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <h3 className="text-white font-semibold mb-3">{getShareTitle()}</h3>

              {/* Preview message */}
              <div className="mb-4 p-3 bg-white/10 rounded-lg">
                <p className="text-xs text-white/80 leading-relaxed">
                  {generateMessage().text}
                </p>
              </div>

              {/* Share options */}
              <div className="space-y-2">
                <button
                  onClick={shareOnX}
                  className="w-full flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
                >
                  <Twitter className="w-4 h-4" />
                  Share on X
                </button>

                <button
                  onClick={shareOnDiscord}
                  className="w-full flex items-center gap-3 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  Copy for Discord
                </button>

                <button
                  onClick={copyLink}
                  className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Message'}
                </button>
              </div>

              {/* Reward info */}
              {type !== 'general' && (
                <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-xs text-green-300 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    +100 RZN +10 Energy for sharing!
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Achievement-specific share component
interface AchievementShareProps {
  achievementId: string;
  onShare?: () => void;
}

export function AchievementShare({ achievementId, onShare }: AchievementShareProps) {
  const achievement = ACHIEVEMENTS[achievementId as keyof typeof ACHIEVEMENTS];

  if (!achievement) return null;

  return (
    <SocialShare
      type="achievement"
      data={{ achievement }}
      onShare={(platform) => {
        console.log(`Shared achievement ${achievementId} on ${platform}`);
        onShare?.();
      }}
    />
  );
}

// Quick share buttons for common actions
interface QuickShareProps {
  stats: {
    scans: number;
    crafts: number;
    rzn: number;
    level?: number;
  };
  onShare?: () => void;
}

export function QuickShare({ stats, onShare }: QuickShareProps) {
  return (
    <div className="flex gap-2">
      <SocialShare
        type="stats"
        data={{ stats }}
        onShare={() => onShare?.()}
      />
    </div>
  );
}

// Milestone share component
interface MilestoneShareProps {
  type: string;
  value: number;
  onShare?: () => void;
}

export function MilestoneShare({ type, value, onShare }: MilestoneShareProps) {
  return (
    <SocialShare
      type="milestone"
      data={{ milestone: { type, value } }}
      onShare={() => onShare?.()}
    />
  );
}

// Social sharing rewards tracker
export function useSocialRewards() {
  const [rewardsEarned, setRewardsEarned] = useState(0);

  const claimShareReward = () => {
    // This would normally be an API call
    const reward = 100; // RZN + Energy
    setRewardsEarned(prev => prev + reward);
    return reward;
  };

  return { rewardsEarned, claimShareReward };
}