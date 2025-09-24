import { useState, useCallback } from 'react';

export interface DailyQuest {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  reward: {
    rzn: number;
    energy?: number;
  };
}

export const useDailyQuests = () => {
  const [quests, setQuests] = useState<DailyQuest[]>([
    {
      id: 'DAILY_SHARE_X',
      name: 'Social Spreader',
      description: 'Share on X today',
      completed: false,
      reward: { rzn: 150, energy: 10 }
    }
  ]);

  const completeQuest = useCallback((questId: string) => {
    setQuests(prev => prev.map(quest =>
      quest.id === questId ? { ...quest, completed: true } : quest
    ));
  }, []);

  const trackXShare = useCallback(async () => {
    return new Promise<boolean>((resolve) => {
      const text = `Check out my Project Retrievium progress! Join me in this amazing neural network game! 🐕⚡ #ProjectRetrievium`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

      // Open X share window
      const shareWindow = window.open(
        url,
        'twitter-share',
        'width=600,height=400,scrollbars=yes,resizable=yes'
      );

      if (!shareWindow) {
        resolve(false);
        return;
      }

      // Track window closure to detect share completion
      let checkClosed: NodeJS.Timeout;

      const onWindowClose = async () => {
        if (shareWindow.closed) {
          clearInterval(checkClosed);

          try {
            // Call API to track the share
            const response = await fetch('/api/track-share', {
              method: 'POST',
              credentials: 'include',
            });

            const result = await response.json();

            if (result.success) {
              // Update local quest state
              completeQuest('DAILY_SHARE_X');
              resolve(true);
            } else {
              console.log('Share tracking:', result.message);
              resolve(false);
            }
          } catch (error) {
            console.error('Error tracking share:', error);
            resolve(false);
          }
        }
      };

      // Check every second if window is closed
      checkClosed = setInterval(onWindowClose, 1000);

      // Cleanup after 5 minutes if window not closed
      setTimeout(() => {
        if (checkClosed) {
          clearInterval(checkClosed);
        }
        if (!shareWindow.closed) {
          shareWindow.close();
        }
        resolve(false);
      }, 300000); // 5 minutes timeout
    });
  }, [completeQuest]);

  const resetDailyQuests = useCallback(() => {
    setQuests(prev => prev.map(quest => ({ ...quest, completed: false })));
  }, []);

  return {
    quests,
    completeQuest,
    trackXShare,
    resetDailyQuests
  };
};