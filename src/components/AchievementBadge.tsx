"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Achievement, AchievementType } from '@/types/achievements';
import { ACHIEVEMENTS, getRarityColor, getRarityBorder } from '@/lib/achievements';
import {
  Search, FlaskConical, Shield, Target, Microscope, Activity, Radio,
  Beaker, FlaskRound, Atom, Scale, Battery, Wind, DollarSign, Gem,
  Star, Zap, Clock, Trophy, Users, PlayCircle
} from 'lucide-react';

const ICON_MAP = {
  Search, FlaskConical, Shield, Target, Microscope, Activity, Radio,
  Beaker, FlaskRound, Atom, Scale, Battery, Wind, DollarSign, Gem,
  Star, Zap, Clock, Trophy, Users, PlayCircle
};

// Helper function to format achievement requirements
function formatRequirement(requirement: any): string {
  if (typeof requirement === 'string') {
    return requirement;
  }

  if (requirement && typeof requirement === 'object') {
    const { type, target } = requirement;

    const typeMap: Record<string, string> = {
      'scans': 'scans',
      'crafts': 'crafts',
      'stabilizes': 'stabilizations',
      'rzn_earned': 'RZN earned',
      'referrals': 'referrals',
      'daily_streak': 'daily streak',
      'social_shares': 'social shares'
    };

    const displayType = typeMap[type] || type;
    return `Complete ${target} ${displayType}`;
  }

  return 'Unknown requirement';
}

interface AchievementBadgeProps {
  achievementId: AchievementType;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function AchievementBadge({
  achievementId,
  unlocked = false,
  size = 'md',
  showTooltip = true
}: AchievementBadgeProps) {
  const achievement = ACHIEVEMENTS[achievementId];
  const [showTooltipModal, setShowTooltipModal] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!achievement) return null;

  const IconComponent = ICON_MAP[achievement.icon as keyof typeof ICON_MAP];

  const updateTooltipPosition = () => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      });
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 p-1',
    md: 'w-12 h-12 p-2',
    lg: 'w-16 h-16 p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const baseClasses = `
    relative rounded-lg border-2 transition-all duration-200
    ${sizeClasses[size]}
    ${unlocked
      ? `${getRarityColor(achievement.rarity)} ${getRarityBorder(achievement.rarity)} shadow-lg`
      : 'bg-gray-800/50 border-gray-600/30 text-gray-500'
    }
    ${unlocked ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'}
  `;

  const badge = (
    <div className="relative">
      <div
        ref={badgeRef}
        className={baseClasses}
        title={showTooltip ? `${achievement.name}: ${achievement.description}` : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showTooltip) {
            updateTooltipPosition();
            setShowTooltipModal(!showTooltipModal);
          }
        }}
        onMouseEnter={() => {
          if (showTooltip && window.innerWidth >= 640) { // Only on desktop (sm breakpoint)
            updateTooltipPosition();
            setShowTooltipModal(true);
          }
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 640) { // Only on desktop
            setShowTooltipModal(false);
          }
        }}
      >
        {IconComponent && (
          <IconComponent
            className={`${iconSizes[size]} ${unlocked ? '' : 'opacity-40'}`}
          />
        )}

        {/* Rarity indicator for unlocked achievements */}
        {unlocked && achievement.rarity !== 'COMMON' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-current opacity-60" />
        )}

        {/* Lock overlay for locked achievements */}
        {!unlocked && (
          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 border border-current rounded" />
          </div>
        )}
      </div>

      {/* Mobile-friendly tooltip - rendered in portal to avoid z-index issues */}
      {mounted && showTooltip && showTooltipModal && createPortal(
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-[9998] bg-black/30 sm:hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltipModal(false);
            }}
          />

          {/* Tooltip content */}
          <div
            className="fixed z-[9999] w-64 sm:w-72 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl"
            style={{
              left: window.innerWidth < 640 ? '50%' : `${tooltipPosition.x}px`,
              top: window.innerWidth < 640 ? '50%' : `${tooltipPosition.y}px`,
              transform: window.innerWidth < 640 ? 'translate(-50%, -50%)' : 'translateX(-50%)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {IconComponent && (
                  <IconComponent className="w-4 h-4 text-yellow-400" />
                )}
                <span className="font-semibold text-white text-sm">{achievement.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  achievement.rarity === 'LEGENDARY' ? 'bg-purple-500/20 text-purple-300' :
                  achievement.rarity === 'EPIC' ? 'bg-blue-500/20 text-blue-300' :
                  achievement.rarity === 'RARE' ? 'bg-green-500/20 text-green-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {achievement.rarity}
                </span>
              </div>
              {/* Close button for mobile */}
              <button
                className="text-gray-400 hover:text-white sm:hidden"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTooltipModal(false);
                }}
              >
                ✕
              </button>
            </div>
            <p className="text-gray-300 text-xs mb-2">{achievement.description}</p>

            {/* Progress Requirements */}
            <div className="text-xs text-gray-400">
              <span className="font-medium">Requirement:</span> {formatRequirement(achievement.requirement)}
            </div>

            {/* Rewards */}
            {(achievement.reward.rzn || achievement.reward.energy) && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Rewards:</div>
                <div className="flex gap-2">
                  {achievement.reward.rzn && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                      <Gem className="w-3 h-3" />
                      +{achievement.reward.rzn} RZN
                    </span>
                  )}
                  {achievement.reward.energy && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      <Zap className="w-3 h-3" />
                      +{achievement.reward.energy} Energy
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="mt-2 pt-2 border-t border-gray-700">
              <span className={`text-xs font-medium ${
                unlocked ? 'text-green-400' : 'text-red-400'
              }`}>
                {unlocked ? '✓ Unlocked' : '🔒 Locked'}
              </span>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );

  return badge;
}

// Achievement notification component
interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const IconComponent = ICON_MAP[achievement.icon as keyof typeof ICON_MAP];

  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`
      fixed top-4 right-4 z-50 p-4 rounded-lg border-2 shadow-2xl
      animate-in slide-in-from-right-5 duration-500
      ${getRarityColor(achievement.rarity)} ${getRarityBorder(achievement.rarity)}
      bg-black/90 backdrop-blur-sm max-w-sm
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {IconComponent && <IconComponent className="w-8 h-8" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-white mb-1">Achievement Unlocked!</h4>
          <p className="font-semibold text-current">{achievement.name}</p>
          <p className="text-xs text-white/70 mt-1">{achievement.description}</p>
          {achievement.reward && (
            <div className="flex gap-2 mt-2 text-xs">
              {achievement.reward.rzn && (
                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                  +{achievement.reward.rzn} RZN
                </span>
              )}
              {achievement.reward.energy && (
                <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                  +{achievement.reward.energy} Energy
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}