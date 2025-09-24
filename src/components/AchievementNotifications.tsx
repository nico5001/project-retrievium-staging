"use client";

import React from 'react';
import { AchievementNotification } from '@/components/AchievementBadge';
import { useAchievementContext } from '@/components/AchievementProvider';

export default function AchievementNotifications() {
  const { notifications, dismissNotification } = useAchievementContext();

  return (
    <>
      {notifications.map(notification => (
        <AchievementNotification
          key={notification.id}
          achievement={notification.achievement}
          onClose={() => dismissNotification(notification.id)}
        />
      ))}
    </>
  );
}